import express, { Request, Response } from "express";
import { catchAsync } from "../../utils/errors";
import { AppError } from "../../errors";
import { vendorModel, integrationModel, organizationModel } from "@merlinn/db";
import { createCredentials } from "@merlinn/utils";
import axios, { AxiosError } from "axios";

const router = express.Router();

// TODO: we need to create an abstraction that creates OAuth endpoints.
// A lot of the code here is duplicated across different vendors. Specifically,
// the code & state checks, the vendor & integration search + creation and the
// storage of the credentials in the secret manager.
router.get(
  "/callback",
  catchAsync(async (req: Request, res: Response) => {
    // The state query param serves as a session id, so we can relate
    // the integration to an organization. Namely, the state is the
    // organization id of the user who installed the vendor.
    const { code, state } = req.query;

    const redirect_uri =
      "https" + "://" + req.get("host") + "/oauth/slack/callback";

    if (!code) {
      throw new AppError("No code was provided", 400);
    } else if (!state) {
      throw new AppError("No state was provided", 400);
    }
    try {
      const params = new URLSearchParams();
      params.append("client_id", process.env.SLACK_CLIENT_ID as string);
      params.append("client_secret", process.env.SLACK_CLIENT_SECRET as string);
      params.append("code", code as string);
      params.append("redirect_uri", redirect_uri);

      const response = await axios.post(
        "https://slack.com/api/oauth.v2.access",
        params,
      );

      const { access_token, ...metadata } = response.data;

      const vendor = await vendorModel.getOne({ name: "Slack" });
      const organization = await organizationModel.getOneById(state as string);
      if (!vendor) {
        throw new AppError(
          "Could not find a Slack vendor. Make sure a vendor is defined.",
          404,
        );
      } else if (!organization) {
        throw new AppError("Could not find the given organization.", 404);
      }

      const credentials = await createCredentials(
        organization._id.toString(),
        vendor.name,
        { access_token },
      );

      // Create the integration
      await integrationModel.create({
        vendor,
        organization,
        credentials,
        metadata,
      });

      return res.send("App installed successfully");
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof AxiosError) {
        if (error.response) {
          throw new AppError(JSON.stringify(error.response.data), 500);
        }
        throw new AppError(error.message, 500);
      }
      throw error;
    }
  }),
);

export { router };
