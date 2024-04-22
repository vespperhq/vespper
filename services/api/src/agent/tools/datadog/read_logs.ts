import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { v2 } from "@datadog/datadog-api-client";
import type { DataDogIntegration } from "@merlinn/db";
import { getLogsInstance } from "../../../clients/datadog";

const timeframe2math = {
  "Last 5 minutes": "5m",
  "Last 15 minutes": "15m",
  "Last 30 minutes": "30m",
  "Last 1 hour": "1h",
  "Last 4 hours": "4h",
  "Last 1 day": "1d",
  "Last 2 days": "2d",
  "Last 7 days": "7d",
};
export default async function (integration: DataDogIntegration) {
  const { apiKey, appKey } = integration.credentials;
  const { region } = integration.metadata;
  const instance = getLogsInstance(apiKey, appKey, region);
  return new DynamicStructuredTool({
    name: "read_datadog_logs",
    description: `Read logs from DataDog`,
    func: async ({ query, timeframe }) => {
      try {
        const from = `now-${timeframe2math[timeframe]}`;
        const params: v2.LogsApiListLogsRequest = {
          body: {
            filter: {
              query,
              from,
            },
            sort: "timestamp",
            page: {
              limit: 2,
            },
          },
        };
        const data = await instance.listLogs(params);
        return JSON.stringify(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return JSON.stringify(error);
      }
    },
    schema: z.object({
      query: z
        .string()
        .describe(
          `DataDog query you wish to execute. Should follow the DataDog log query syntax.`,
        ),
      timeframe: z
        .enum([
          "Last 5 minutes",
          "Last 15 minutes",
          "Last 30 minutes",
          "Last 1 hour",
          "Last 4 hours",
          "Last 1 day",
          "Last 2 days",
          "Last 7 days",
        ])
        .describe("The period for which you wish to search the logs."),
    }),
  });
}
