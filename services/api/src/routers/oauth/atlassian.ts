import express, { Request, Response } from "express";
import { catchAsync } from "../../utils/errors";
import { AppError } from "../../errors";
import { AxiosError } from "axios";
import { vendorModel, organizationModel, integrationModel } from "@merlinn/db";
import { secretManager } from "../../common/secrets";
import { AtlassianClient } from "../../clients";

const router = express.Router();

router.get(
  "/callback",
  catchAsync(async (req: Request, res: Response) => {
    // The state query param serves as a session id, so we can relate
    // the integration to an organization. Namely, the state is the
    // organization id of the user who installed the vendor.
    const { code, state } = req.query;

    const redirect_uri =
      "https" + "://" + req.get("host") + "/oauth/atlassian/callback";

    if (!code) {
      throw new AppError("No code was provided", 400);
    } else if (!state) {
      throw new AppError("No state was provided", 400);
    }
    try {
      const clientId = process.env.ATLASSIAN_CLIENT_ID as string;
      const clientSecret = process.env.ATLASSIAN_CLIENT_SECRET as string;

      const response = await AtlassianClient.getToken({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
        redirect_uri,
      });

      const { access_token, refresh_token, ...metadata } = response.data;

      // TODO: Determine if this is a JIRA connection or a Confluence connection in a better way.
      // Right now, we simply check whether the scope contains jira scopes or not.
      // It's kinda dumb but works. Need to find a better way though
      const vendorName = metadata.scope.includes("jira")
        ? "Jira"
        : "Confluence";
      const vendor = await vendorModel.getOne({
        name: vendorName,
      });
      if (!vendor) {
        throw new AppError(
          `Could not find an ${vendorName} vendor. Make sure a vendor is defined.`,
          404,
        );
      }

      const organization = await organizationModel.getOneById(state as string);
      if (!organization) {
        throw new AppError("Could not find the given organization.", 404);
      }

      const formattedCredentials = (await secretManager.createCredentials(
        organization._id.toString(),
        vendor.name,
        { access_token, refresh_token },
      )) as Record<string, string>;

      // Create the integration
      await integrationModel.create({
        vendor,
        organization,
        credentials: formattedCredentials,
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
