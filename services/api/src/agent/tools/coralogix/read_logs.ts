import { AxiosError } from "axios";
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import type { CoralogixIntegration } from "@merlinn/db";
import type { CoralogixRegionKey } from "../../../types";
import { Timescale, getTimestamp } from "../../../utils/dates";
import { buildOutput } from "../utils";
import { CoralogixClient } from "../../../clients";

export enum Timeframe {
  Last1Minute = "Last 1 minute",
  Last2Minutes = "Last 2 minutes",
  Last5Minutes = "Last 5 minutes",
  Last15Minutes = "Last 15 minutes",
  Last30Minutes = "Last 30 minutes",
  Last1Hour = "Last 1 hour",
  Last2Hours = "Last 2 hours",
  Last6Hours = "Last 6 hours",
  Last12Hours = "Last 12 hours",
  Last24Hours = "Last 24 hours",
  Last2Days = "Last 2 days",
  Last3Days = "Last 3 days",
  Last5Days = "Last 5 days",
  Last7Days = "Last 7 days",
}

export const timeframe2values: Record<Timeframe, [number, Timescale]> = {
  [Timeframe.Last1Minute]: [1, "minutes"],
  [Timeframe.Last2Minutes]: [2, "minutes"],
  [Timeframe.Last5Minutes]: [5, "minutes"],
  [Timeframe.Last15Minutes]: [15, "minutes"],
  [Timeframe.Last30Minutes]: [30, "minutes"],
  [Timeframe.Last1Hour]: [1, "hours"],
  [Timeframe.Last2Hours]: [2, "hours"],
  [Timeframe.Last6Hours]: [6, "hours"],
  [Timeframe.Last12Hours]: [12, "hours"],
  [Timeframe.Last24Hours]: [24, "hours"],
  [Timeframe.Last2Days]: [2, "days"],
  [Timeframe.Last3Days]: [3, "days"],
  [Timeframe.Last5Days]: [5, "days"],
  [Timeframe.Last7Days]: [7, "days"],
};

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
          // Timeframe.Last1Minute,
          // Timeframe.Last2Minutes,
          // Timeframe.Last5Minutes,
          // Timeframe.Last15Minutes,
          // Timeframe.Last30Minutes,
          // Timeframe.Last1Hour,
          // Timeframe.Last2Hours,
          // Timeframe.Last6Hours,
          // Timeframe.Last12Hours,
          Timeframe.Last24Hours,
          // Timeframe.Last2Days,
          // Timeframe.Last3Days,
          // Timeframe.Last5Days,
          // Timeframe.Last7Days,
        ])
        .describe("The period for which you wish to search the logs."),
    }),
  });
}
