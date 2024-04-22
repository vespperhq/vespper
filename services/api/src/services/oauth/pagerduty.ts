import { AxiosError } from "axios";
import { integrationModel } from "@merlinn/db";
import type { PagerDutyIntegration } from "@merlinn/db";
import { PagerDutyClient } from "../../clients";
import {
  populateCredentials,
  recreateCredentials,
} from "../../clients/secretManager";
import { AppError } from "../../errors";

export async function refreshToken(integrationId: string) {
  try {
    const integration = (await integrationModel.getOneById(
      integrationId,
    )) as PagerDutyIntegration;
    if (!integration) {
      throw new AppError("Could not find the given integration.", 404);
    }
    const populatedIntegration = (
      await populateCredentials([integration])
    )[0] as PagerDutyIntegration;

    const clientId = process.env.PAGERDUTY_CLIENT_ID as string;
    const clientSecret = process.env.PAGERDUTY_CLIENT_SECRET as string;

    const response = await PagerDutyClient.getToken({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: populatedIntegration.credentials.refresh_token,
    });

    const { access_token, refresh_token, token_type, scope, expires_in } =
      response.data;

    await recreateCredentials(integration, {
      access_token,
      refresh_token,
    });

    // Update the metadata of the integration
    await integrationModel.getOneByIdAndUpdate(integration._id, {
      metadata: {
        ...integration.metadata,
        token_type,
        scope,
        expires_in,
      },
    });
  } catch (error) {
    console.log(error);
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
}
