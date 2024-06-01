import { AxiosError } from "axios";
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import type { CoralogixIntegration } from "@merlinn/db";
import type { CoralogixRegionKey } from "../../../types";
import { Timescale, getTimestamp } from "../../../utils/dates";
import { buildOutput } from "../utils";
import { CoralogixClient } from "../../../clients";

const timeframe2values = {
  "Last 1 minute": [1, "minutes"],
  "Last 2 minutes": [2, "minutes"],
  "Last 5 minutes": [5, "minutes"],
  "Last 15 minutes": [15, "minutes"],
  "Last 30 minutes": [30, "minutes"],
  "Last 1 hour": [1, "hours"],
  "Last 2 hours": [2, "hours"],
  "Last 6 hours": [6, "hours"],
  "Last 12 hours": [12, "hours"],
  "Last 24 hours": [24, "hours"],
  "Last 2 days": [2, "days"],
  "Last 3 days": [3, "days"],
  "Last 5 days": [5, "days"],
  "Last 7 days": [7, "days"],
} as Record<string, [number, Timescale]>;

export const fetchLogs = async (
  query: string,
  startDate: string,
  endDate: string,
  apiKey: string,
  region: CoralogixRegionKey,
) => {
  const client = new CoralogixClient({ logsKey: apiKey }, region);
  const result = await client.getLogs({
    syntax: "QUERY_SYNTAX_DATAPRIME",
    query,
    startDate,
    endDate,
  });
  return result;
};

export default async function (integration: CoralogixIntegration) {
  const { logsKey } = integration.credentials;
  const { region, domainURL } = integration.metadata;

  // const fields = integration.settings?.tools?.readLogs?.allowedFields;
  return new DynamicStructuredTool({
    name: "read_coralogix_logs",
    description: `Read logs from Coralogix`,
    func: async ({ query, timeframe }) => {
      try {
        const [amount, scale] = timeframe2values[timeframe];
        const startDate = getTimestamp({ amount, scale });
        const endDate = new Date().toISOString();

        const client = new CoralogixClient({ logsKey }, region);
        const result = await client.getLogs({
          syntax: "QUERY_SYNTAX_DATAPRIME",
          query,
          startDate,
          endDate,
        });

        if (!result.result?.results) {
          return `Coraloigx returned empty result. Information: ${JSON.stringify(
            result,
          )}`;
        }

        const logsExist = result.result.results.length > 0;
        const logsStr = JSON.stringify(result).slice(0, 10000);

        let output: string;
        if (logsExist) {
          const link = `${domainURL}/#/query-new/logs?query=${encodeURIComponent(
            query,
          )}&time=from:${startDate},to:${endDate}&page=0&querySyntax=dataprime&permalink=true`;
          const markdownLink = `[Coralogix Logs Link](${link})`;
          const sources = [markdownLink];
          output = buildOutput(logsStr, sources);
        } else {
          output = logsStr;
        }

        return output;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        let message;
        if (error instanceof AxiosError) {
          message = error.response?.data;
        } else {
          message = error.message;
        }
        return `Error occured. ${message}. Make sure parameters are valid.`;
      }
    },
    schema: z.object({
      query: z
        .string()
        .describe(
          "Query to run. Should be a valid Coralogix DataPrime syntax query.",
        ),
      timeframe: z
        .enum([
          "Last 1 minute",
          "Last 2 minutes",
          "Last 5 minutes",
          "Last 15 minutes",
          "Last 30 minutes",
          "Last 1 hour",
          "Last 2 hours",
          "Last 6 hours",
          "Last 12 hours",
          "Last 24 hours",
          "Last 2 days",
          "Last 3 days",
          "Last 5 days",
          "Last 7 days",
        ])
        .describe("The period for which you wish to search the logs."),
    }),
  });
}
