import express, { Request, Response } from "express";
import { vendorModel, organizationModel, integrationModel } from "@merlinn/db";
import { catchAsync } from "../../utils/errors";
import { AppError } from "../../errors";
import axios, { AxiosError } from "axios";
import { secretManager } from "../../common/secrets";

const router = express.Router();

router.get(
  "/callback",
  catchAsync(async (req: Request, res: Response) => {
    const { code, state } = req.query;
    if (!code) {
      throw AppError({ message: "No code was provided", statusCode: 400 });
    } else if (!state) {
      throw AppError({ message: "No state was provided", statusCode: 400 });
    }

    try {
      const params = new URLSearchParams();
      params.append("client_id", process.env.GH_APP_CLIENT_ID as string);
      params.append(
        "client_secret",
        process.env.GH_APP_CLIENT_SECRET as string,
      );
      params.append("code", code as string);

      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        params,
      );

      const credentials = response.data
        .split("&")
        .reduce((total: Record<string, string>, current: string) => {
          const [key, val] = current.split("=");
          total[key] = val;
          return total;
        }, {});

      const vendor = await vendorModel.getOne({ name: "Github" });
      const organization = await organizationModel.getOneById(state as string);
      if (!vendor) {
        throw AppError({
          message:
            "Could not find a Github vendor. Make sure a vendor is defined.",
          statusCode: 404,
        });
      } else if (!organization) {
        throw AppError({
          message: "Could not find the given organization.",
          statusCode: 404,
        });
      }

      const { access_token, ...metadata } = credentials;

      // Get installation id
      const {
        data: { installations },
      } = await axios.get("https://api.github.com/user/installations", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      // TODO: possible bug in case there are multiple organizations/accounts that Merlinn is installed on
      const installation = installations[0];
      const formattedCredentials = (await secretManager.createCredentials(
        organization._id.toString(),
        vendor.name,
        { access_token },
      )) as Record<string, string>;

      // Create the integration
      await integrationModel.create({
        vendor,
        organization,
        type: "oauth",
        credentials: formattedCredentials,
        metadata: {
          ...metadata,
          installationId: installation.id,
          githubOrgId: installation.account.id,
        },
      });

      return res.send("App installed successfully");
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response) {
          throw AppError({
            message: JSON.stringify(error.response.data),
            statusCode: 500,
          });
        }
        throw AppError({ message: error.message, statusCode: 500 });
      }
      throw error;
    }
  }),
);

export { router };
