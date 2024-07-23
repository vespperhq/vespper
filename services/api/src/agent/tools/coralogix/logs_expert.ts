import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { PromptTemplate } from "langchain/prompts";
import { CoralogixIntegration } from "@merlinn/db";
import { DATAPRIME_CHEATSHEET } from "./constants";
import { getCommonLogFields, getPrettyLogSample } from "./utils";
import { buildOutput } from "../utils";
import { JsonOutputParser } from "langchain/schema/output_parser";
import { chatModel } from "../../../agent/model";
import { getTimestamp, timeframe2values } from "../../../utils/dates";
import { CoralogixClient } from "../../../clients";
import { RunContext } from "../../../agent/types";

const PROMPT_TEMPLATE = `
You are a Coralogix logs expert. Given a request in natural language, you should generate {nQueries} queries in a DataPrime syntax.
DataPrime is Coralogix's proprietary query language that allows you to query logs in a more structured way.

Here is a cheatsheet of DataPrime query language:
{cheatsheet}

Here are the common fields that you can use in your query (they were taken from the environment itself):
{commonFields}

Here is a sample of logs so you'd know how they look like:
{logSample}

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

  const commonFields = await getCommonLogFields(logsKey, region);
  const logSample = await getPrettyLogSample(logsKey, region, 2);

  return new DynamicStructuredTool({
    name: "logs_expert_tool",
    description: TOOL_DESCRIPTION,
    func: async ({ request }) => {
      try {
        const prompt = await PromptTemplate.fromTemplate(
          PROMPT_TEMPLATE,
        ).format({
          nQueries: 3,
          cheatsheet: DATAPRIME_CHEATSHEET,
          commonFields: commonFields.join(", "),
          logSample: logSample,
          request,
        });

        const parser = new JsonOutputParser();
        const { content } = await chatModel.invoke(prompt);
        const { queries } = await parser.parse(content as string);
        if (!queries || queries.length === 0) {
          throw new Error("No queries generated");
        }

        const [amount, scale] = timeframe2values["Last 24 hours"];
        const startDate = getTimestamp({ amount, scale });
        const endDate = new Date().toISOString();
        const client = new CoralogixClient({ logsKey }, region);
        const results = (
          await Promise.all(
            queries.map(async (query: string) => {
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

              return result;
            }),
          )
        )
          .filter((result) => result.result?.results?.length > 0)
          .reduce(
            (acc, val, index) => {
              acc.queries.push(queries[index]);
              acc.results.push(val.result.results);
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

        // TODO: this is a temporary solution, to look at more
        // specific and fewer log results for now.
        const logs = results.results.sort(
          (a: string[], b: string[]) => a.length - b.length,
        );
        const logsStr = JSON.stringify(logs).slice(0, 10000);
        const output = buildOutput(logsStr, sources);

        return output;
      } catch (error) {
        console.error(error);
        return JSON.stringify(error);
      }
    },
    schema: z.object({
      request: z.string().describe("The request to be used with Coralogix."),
    }),
  });
}
