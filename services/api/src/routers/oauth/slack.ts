import express, { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { vendorModel, integrationModel, organizationModel } from "@merlinn/db";
import { catchAsync } from "../../utils/errors";
import { AppError } from "../../errors";
import { secretManager } from "../../common/secrets";

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

      // Get the bot id. Slack doesn't return this piece of information by default.
      // https://github.com/slackapi/bolt-js/issues/196
      console.log("bot_user_id", metadata.bot_user_id);
      const { data: userData } = await axios.get(
        `https://slack.com/api/users.info?user=${metadata.bot_user_id}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      console.log(userData);
      const bot_id = userData.user.profile.bot_id;

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

      const credentials = (await secretManager.createCredentials(
        organization._id.toString(),
        vendor.name,
        { access_token },
      )) as Record<string, string>;

      // Create the integration
      await integrationModel.create({
        vendor,
        organization,
        credentials,
        type: "oauth",
        metadata: { ...metadata, bot_id },
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
