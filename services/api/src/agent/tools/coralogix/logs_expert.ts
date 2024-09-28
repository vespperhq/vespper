import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { PromptTemplate } from "langchain/prompts";
import { CoralogixIntegration } from "@vespper/db";
import { CallbackHandler } from "langfuse-langchain";
import { DATAPRIME_CHEATSHEET } from "./constants";
import {
  filterHighCardinalityFields,
  getCommonLogFields,
  getCommonLogValues,
  getPrettyLogAnalysis,
  getPrettyLogSample,
  getQueriesHistory,
  limitLogs,
} from "./utils";
import { buildOutput } from "../utils";
import { JsonOutputParser } from "langchain/schema/output_parser";
import { chatModel } from "../../../agent/model";
import {
  getTimestamp,
  Timeframe,
  timeframe2values,
} from "@utils/dates";
import { isLangfuseEnabled } from "@utils/ee";
import { RunContext } from "@agent/types";

const PROMPT_TEMPLATE = `
You are a Coralogix logs expert. Given a request in natural language, you should generate {nQueries} queries in a DataPrime syntax.
DataPrime is Coralogix's proprietary query language that allows you to query logs in a more structured way.

Here is a cheatsheet of DataPrime query language:
{cheatsheet}

Here are the common fields that you can use in your query (they were taken from the environment itself):
{commonFields}

Here are the common values that you can use in your query (they were taken from the environment itself):
{commonValues}

Here is a sample of logs so you'd know how they look like:
{logSample}

Here is a sample of queries that the team has already used (can be really useful! in most cases, you should use them as a reference):
{queriesHistory}

You should return your answer as a block of Thought, Observation and Answer.
The thought section should contain a thought that you have about the request.
The observation section should contain an observation on log sample/cheatsheet/common fields.
The answer section should contain a JSON with only one key called "queries", and it should be a list of valid DataPrime queries.

For instance, given the following logSample + request:

Log sample
resource.attributes.service.name: recommendationservice
logRecord.severityText: WARN
logRecord.body: Receive ListRecommendations for product ids:['OLJCESPC7Z', 'L9ECAV7KIM', '66VCHSJNUP', '6E92ZMYYFZ', 'LS4PSXUNUM']

Request:
"Please fetch all the warning logs for the recommendationservice"

Your answer should be as follows:
Thought: I think that the request is asking for logs with a specific severity level for a specific service, in this case, the "recommendationservice".
Observation: The log sample contains the service name and the severity level. The fields are called "resource.attributes.service.name" and "logRecord.severityText".
Answer:
\`\`\`json
{{"queries": ["source logs | filter resource.attributes.service.name == 'recommendationservice' && logRecord.severityText == 'WARN'"]}}
\`\`\`

Please create variations of the queries to cover more ground. Try to make some of them wider and some of them more specific.
Start from the service level and then go deeper into the logs.

IMPORTANT! Always look at the log sample and the common fields to understand the structure of the logs, so your queries are valid.
IMPORTANT! Don't include timestamp filters. We add them in the metadata of the query, not in the query itself.

Begin!

{request}
`;

const TOOL_DESCRIPTION = `
This tool serves as a Coralogix logs expert. Given a request in plain english, it will try to find the relevant logs.
Here are some examples that you can use:
- Please fetch the logs for the last 24 hours of service X
- Can you fetch the logs for service Y from the production environment?
`;

export default async function (
  integration: CoralogixIntegration,
  context: RunContext,
) {
  console.log(context);

  const { logsKey } = integration.credentials;
  const { region, domainURL } = integration.metadata;

  return new DynamicStructuredTool({
    name: "logs_expert_tool",
    description: TOOL_DESCRIPTION,
    func: async ({ request, timeframe }) => {
      try {
        const logSample = await getPrettyLogSample(logsKey, region, 2);
        const commonFields = await getCommonLogFields(logsKey, region);
        const filteredFields = await filterHighCardinalityFields(logSample);
        const queriesHistory = await getQueriesHistory(integration);

        const commonValues = await getCommonLogValues(
          filteredFields,
          logsKey,
          region,
          20,
        );

        const prettyCommonFields = commonFields.join("\n");
        const prettyCommonValues = Object.entries(commonValues)
          .map(([key, value]) => `${key}: ${value.join(", ")}`)
          .join("\n");
        const prettyQueriesHistory = queriesHistory.join("\n");

        const prompt = await PromptTemplate.fromTemplate(
          PROMPT_TEMPLATE,
        ).format({
          nQueries: 3,
          cheatsheet: DATAPRIME_CHEATSHEET,
          commonFields: prettyCommonFields,
          commonValues: prettyCommonValues,
          queriesHistory: prettyQueriesHistory,
          logSample: logSample,
          request,
        });

        const parser = new JsonOutputParser();
        const callbacks = [];
        if (isLangfuseEnabled()) {
          const span = context.trace!.span({
            name: "generateQueries",
            metadata: {
              commonFields: prettyCommonFields,
              commonValues: prettyCommonValues,
              queriesHistory: prettyQueriesHistory,
              logSample: logSample,
              request,
            },
          });
          const handler = new CallbackHandler({ root: span });
          callbacks.push(handler);
        }
        const { content } = await chatModel.invoke(prompt, { callbacks });
        const { queries } = await parser.parse(content as string);
        if (!queries || queries.length === 0) {
          throw new Error("No queries generated");
        }

        const [amount, scale] = timeframe2values[timeframe];
        const startDate = getTimestamp({ amount, scale });
        const endDate = new Date().toISOString();
        const results = (
          await Promise.all(
            queries.map(async (query: string) => {
              try {
                const { analysis, parsedLogs } = await getPrettyLogAnalysis({
                  query,
                  integration,
                  timeframe,
                });

                if (isLangfuseEnabled()) {
                  context.trace!.span({
                    name: "getLogs",
                    metadata: {
                      query,
                      analysis,
                    },
                  });
                }
                if (
                  !parsedLogs.result?.results ||
                  parsedLogs.result?.results.length === 0
                ) {
                  return `Coraloigx returned empty result. Information: ${JSON.stringify(
                    parsedLogs,
                  )}`;
                }

                if (!analysis) {
                  const logsStr = limitLogs(JSON.stringify(parsedLogs));
                  const output = `
                  Here are the log results for query: ${query}
                  ${logsStr}
                  `;
                  return output;
                }

                const output = `
                Here is a log analysis for query: ${query}
                Analysis:
                ${analysis}
                `;
                return output;
              } catch (error) {
                return null;
              }
            }),
          )
        )
          .filter(Boolean)
          .reduce(
            (acc, val, index) => {
              acc.queries.push(queries[index]);
              acc.results.push(val);
              return acc;
            },
            { queries: [], results: [] },
          );

        const sources = results.queries.map((query: string) => {
          const link = `${domainURL}/#/query-new/logs?query=${encodeURIComponent(
            query,
          )}&time=from:${startDate},to:${endDate}&page=0&querySyntax=dataprime&permalink=true`;
          return `[Coralogix Logs Link](${link})`;
        });

        const analyses = results.results;
        const logsStr = JSON.stringify(analyses).slice(0, 10000);
        const output = buildOutput(logsStr, sources);

        return output;
      } catch (error) {
        console.error(error);
        return JSON.stringify(error);
      }
    },
    schema: z.object({
      request: z.string().describe("The request to be used with Coralogix."),
      timeframe: z
        .enum([
          Timeframe.Last1Minute,
          Timeframe.Last2Minutes,
          Timeframe.Last5Minutes,
          Timeframe.Last15Minutes,
          Timeframe.Last30Minutes,
          Timeframe.Last1Hour,
          Timeframe.Last2Hours,
          Timeframe.Last6Hours,
          Timeframe.Last12Hours,
          Timeframe.Last24Hours,
          Timeframe.Last2Days,
          Timeframe.Last3Days,
          Timeframe.Last5Days,
          Timeframe.Last7Days,
        ])
        .describe(
          "The period for which you wish to search the logs. Default is last 24 hours.",
        )
        .default(Timeframe.Last24Hours),
    }),
  });
}
