import axios from "axios";
import { CoralogixIntegration, IIntegration } from "@merlinn/db";
import { Timeframe, getTimestamp, timeframe2values } from "../../utils/dates";
import { CoralogixClient } from "../../clients/coralogix";
import { extractLogStructureKeysPrompt } from "../../agent/prompts";
import { JsonOutputParser } from "langchain/schema/output_parser";
import { chatModel } from "../../agent/model";

interface LogCluster extends Record<string, unknown> {
  Level: string;
  EventId: string;
  EventTemplate: string;
  Occurrences: number;
  Percentage: number;
}

interface ParseLogsResponse {
  clusters: LogCluster[];
}

async function extractLogStructuralKeys(logRecords: string[]) {
  const queriesPrompt = await extractLogStructureKeysPrompt.format({
    logRecords,
  });
  const parser = new JsonOutputParser();
  try {
    const { content } = await chatModel.invoke(queriesPrompt);
    const { severityKey, messageKey } = await parser.parse(content as string);
    if (!severityKey || !messageKey) {
      throw new Error("Failed to extract log structure keys");
    }
    return { severityKey, messageKey };
  } catch (error) {
    console.error("Error generating queries", error);
    throw error;
  }
}

export async function getLogClusters(
  integration: IIntegration,
  timeframe: Timeframe = Timeframe.Last24Hours,
): Promise<LogCluster[]> {
  switch (integration.vendor.name) {
    case "Coralogix": {
      const { logsKey } = (integration as CoralogixIntegration).credentials;
      const { region } = (integration as CoralogixIntegration).metadata;

      const [amount, scale] = timeframe2values[timeframe];
      const startDate = getTimestamp({ amount, scale });
      const endDate = new Date().toISOString();

      const client = new CoralogixClient({ logsKey }, region);
      const logs = await client.getRawLogs({
        syntax: "QUERY_SYNTAX_DATAPRIME",
        query: "",
        startDate,
        endDate,
      });

      const parsedLogs = client.parseResult(logs);
      const sample = parsedLogs.result.results
        .slice(0, 2)
        .map((log) => log.userData);
      try {
        const { messageKey, severityKey } =
          await extractLogStructuralKeys(sample);

        const logParserUrl = process.env.LOG_PARSER_URL as string;
        const { data } = await axios.post<ParseLogsResponse>(
          `${logParserUrl}/parse/coralogix`,
          { logs, severityKey, messageKey },
        );

        return data.clusters;
      } catch (error) {
        console.error("Error clustering logs", error);
        throw error;
      }
    }
    default: {
      throw new Error("Unknown log vendor");
    }
  }
}

// (async () => {
//   await connectToDB(process.env.MONGO_URI as string);

//   let integrations = (await integrationModel
//     .get()
//     .populate("vendor")) as IIntegration[];
//   integrations = await secretManager.populateCredentials(integrations);

//   const logVendor = integrations.find(
//     (integration) => integration.vendor.name === "Coralogix",
//   );

//   if (!logVendor) {
//     throw new Error("No Coralogix integration found");
//   }

//   const clusters = await getLogClusters(logVendor);

//   console.log(clusters);
// })();
