import { AxiosError } from "axios";
import { integrationModel } from "@merlinn/db";
import type { AtlassianIntegration } from "@merlinn/db";
import { populateCredentials, recreateCredentials } from "@merlinn/utils";
import { AtlassianClient } from "../../clients";
import { AppError } from "../../errors";

export async function refreshToken(integrationId: string) {
  try {
    const integration = (await integrationModel.getOneById(
      integrationId,
    )) as AtlassianIntegration;
    if (!integration) {
      throw new AppError("Could not find the given integration.", 404);
    }
    const populatedIntegration = (
      await populateCredentials([integration])
    )[0] as AtlassianIntegration;

    const clientId = process.env.ATLASSIAN_CLIENT_ID as string;
    const clientSecret = process.env.ATLASSIAN_CLIENT_SECRET as string;

    const response = await AtlassianClient.getToken({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: populatedIntegration.credentials.refresh_token,
    });

    const { access_token, refresh_token, expires_in, scope } = response.data;

    await recreateCredentials(integration, { access_token, refresh_token });

    // Update the metadata of the integration
    await integrationModel.getOneByIdAndUpdate(integration._id, {
      metadata: {
        expires_in,
        scope,
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
