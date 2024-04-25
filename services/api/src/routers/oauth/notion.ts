import express, { Request, Response } from "express";
import { catchAsync } from "../../utils/errors";
import { AppError } from "../../errors";
import axios, { AxiosError } from "axios";
import { vendorModel, organizationModel, integrationModel } from "@merlinn/db";
import { createCredentials } from "@merlinn/utils";

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
      throw new AppError("No code was provided", 400);
    } else if (!state) {
      throw new AppError("No state was provided", 400);
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

      const {
        access_token,
        bot_id,
        duplicated_template_id,
        owner,
        workspace_icon,
        workspace_id,
        workspace_name,
      } = response.data;

      const vendor = await vendorModel.getOne({ name: "Notion" });
      const organization = await organizationModel.getOneById(state as string);
      if (!vendor) {
        throw new AppError(
          "Could not find a Notion vendor. Make sure a vendor is defined.",
          404,
        );
      } else if (!organization) {
        throw new AppError("Could not find the given organization.", 404);
      }

      const formattedCredentials = await createCredentials(
        organization._id.toString(),
        vendor.name,
        { access_token },
      );

      // Create the integration
      await integrationModel.create({
        vendor,
        organization,
        credentials: formattedCredentials,
        metadata: {
          bot_id,
          duplicated_template_id,
          owner,
          workspace_icon,
          workspace_id,
          workspace_name,
        },
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
