import { AxiosError } from "axios";
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import type { CoralogixIntegration } from "@merlinn/db";
import type { CoralogixRegionKey } from "../../../types";
import {
  Timeframe,
  getTimestamp,
  timeframe2values,
} from "../../../utils/dates";
import { buildOutput } from "../utils";
import { CoralogixClient } from "../../../clients";

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
