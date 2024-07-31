import express, { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { vendorModel, organizationModel, integrationModel } from "@merlinn/db";
import { catchAsync } from "../../utils/errors";
import { AppError } from "../../errors";
import { secretManager } from "../../common/secrets";

const router = express.Router();

router.get(
  "/callback",
  catchAsync(async (req: Request, res: Response) => {
    // The state query param serves as a session id, so we can relate
    // the integration to an organization. Namely, the state is the
    // organization id of the user who installed the vendor.
    const { code, state } = req.query;

    const redirect_uri =
      "https" + "://" + req.get("host") + "/oauth/notion/callback";

    if (!code) {
      throw AppError({ message: "No code was provided", statusCode: 400 });
    } else if (!state) {
      throw AppError({ message: "No state was provided", statusCode: 400 });
    }
    try {
      const clientId = process.env.NOTION_CLIENT_ID as string;
      const clientSecret = process.env.NOTION_CLIENT_SECRET as string;
      const encodedAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64",
      );

      const data = {
        grant_type: "authorization_code",
        code,
        redirect_uri,
      };
      const headers = {
        Authorization: `Basic ${encodedAuth}`,
        "Content-Type": "application/json",
      };

      const response = await axios.post(
        "https://api.notion.com/v1/oauth/token",
        data,
        {
          headers,
        },
      );

      const { access_token, ...metadata } = response.data;

      const vendor = await vendorModel.getOne({ name: "Notion" });
      const organization = await organizationModel.getOneById(state as string);
      if (!vendor) {
        throw AppError({
          message:
            "Could not find a Notion vendor. Make sure a vendor is defined.",
          statusCode: 404,
        });
      } else if (!organization) {
        throw AppError({
          message: "Could not find the given organization.",
          statusCode: 404,
        });
      }

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
        metadata,
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
