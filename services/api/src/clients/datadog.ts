import { client, v2 } from "@datadog/datadog-api-client";

export const getLogsInstance = (
  apiKey: string,
  appKey: string,
  region: "us" | "eu" = "us",
) => {
  const configuration = client.createConfiguration({
    authMethods: {
      apiKeyAuth: apiKey,
      appKeyAuth: appKey,
    },
  });
  configuration.setServerVariables({
    site: region === "eu" ? "datadoghq.eu" : "datadoghq.com",
  });
  const apiInstance = new v2.LogsApi(configuration);

  return apiInstance;
};
