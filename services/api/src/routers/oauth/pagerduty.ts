import express, { Request, Response } from "express";
import { catchAsync } from "../../utils/errors";
import { AppError } from "../../errors";
import { AxiosError } from "axios";
import { vendorModel, integrationModel, organizationModel } from "@merlinn/db";
import { PagerDutyClient } from "../../clients";
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
      "https" + "://" + req.get("host") + "/oauth/pagerduty/callback";

    if (!code) {
      throw new AppError("No code was provided", 400);
    } else if (!state) {
      throw new AppError("No state was provided", 400);
    }

    try {
      const response = await PagerDutyClient.getToken({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri,
        client_id: process.env.PAGERDUTY_CLIENT_ID as string,
        client_secret: process.env.PAGERDUTY_CLIENT_SECRET as string,
      });

      const vendor = await vendorModel.getOne({ name: "PagerDuty" });
      const organization = await organizationModel.getOneById(state as string);
      if (!vendor) {
        throw new AppError(
          "Could not find a PagerDuty vendor. Make sure a vendor is defined.",
          404,
        );
      } else if (!organization) {
        throw new AppError("Could not find the given organization.", 404);
      }

      const { id_token, access_token, refresh_token, ...metadata } =
        response.data;

      const formattedCredentials = (await secretManager.createCredentials(
        organization._id.toString(),
        vendor.name,
        {
          id_token,
          access_token,
          refresh_token,
        },
      )) as Record<string, string>;

      // Create the integration
      await integrationModel.create({
        vendor,
        organization,
        credentials: formattedCredentials,
        metadata,
      });

      return res.status(200).send("Successfully integrated PagerDuty!");
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
