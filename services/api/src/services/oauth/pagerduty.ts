import { AxiosError } from "axios";
import { integrationModel } from "@vespper/db";
import type { PagerDutyIntegration } from "@vespper/db";
import { PagerDutyClient } from "../../clients";
import { AppError } from "../../errors";
import { secretManager } from "../../common/secrets";

export async function refreshToken(integrationId: string) {
  try {
    const integration = (await integrationModel.getOneById(
      integrationId,
    )) as PagerDutyIntegration;
    if (!integration) {
      throw AppError({
        message: "Could not find the given integration.",
        statusCode: 404,
      });
    }
    const populatedIntegration = (
      await secretManager.populateCredentials([integration])
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

    await secretManager.recreateCredentials(integration, {
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
}
