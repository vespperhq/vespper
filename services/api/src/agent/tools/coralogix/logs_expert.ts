import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import CallbackHandler from "langfuse-langchain";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { CoralogixIntegration } from "@merlinn/db";
import util from "util";
import { createAgent } from "../base";
import { DATAPRIME_CHEATSHEET } from "./constants";
import { getCommonLogFields, getPrettyLogSample } from "./utils";
import { default as readLogs } from "./read_logs";
import { default as getFieldsValues } from "./get_fields_values";
import { RunContext } from "../../../agent/types";
import { AnswerContext, LLMCallbacks } from "../../../agent/callbacks";
import { buildOutput } from "../utils";

const TOOL_LOADERS = [readLogs, getFieldsValues];

const PROMPT_TEMPLATE = `
You are a Coralogix logs expert. Your mission is to fetch logs, based on users requests.

At your disposal, you have a read_logs tool. Given a DataPrime query and a timeframe, it will try to fetch the logs from Coralogix.
DataPrime is a specialized query language that allows you to search logs in Coralogix.

Here is a cheatsheet of DataPrime query language:
${DATAPRIME_CHEATSHEET}

Here are the common fields that you can use in your query (they were taken from the environment itself):
%s

Here is a sample of logs so you'd know how they look like:
%s

IMPORTANT NOTE:
- Before querying based on a field, please call the get_distinct_log_values tool to see the unique values for that field.

If you can't find the answer, please ask clarifying questions and get some help.
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
  const { logsKey } = integration.credentials;
  const { region } = integration.metadata;

  const tools = await Promise.all(
    TOOL_LOADERS.map((loader) => loader(integration)),
  );
  const commonFields = await getCommonLogFields(logsKey, region);

  const logSample = await getPrettyLogSample(logsKey, region, 2);

  const prompt = util.format(
    PROMPT_TEMPLATE,
    JSON.stringify(commonFields),
    JSON.stringify(logSample),
  );
  const template = ChatPromptTemplate.fromMessages([
    ["ai", prompt],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);
  const lfCallback = new CallbackHandler({
    root: context.trace!.span({}),
    secretKey: process.env.LANGFUSE_SECRET_KEY as string,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY as string,
    baseUrl: process.env.LANGFUSE_HOST as string,
  });
  const agent = await createAgent(tools, template);

  return new DynamicStructuredTool({
    name: "logs_expert_tool",
    description: TOOL_DESCRIPTION,
    func: async ({ request }) => {
      try {
        const answerContext = new AnswerContext(context.trace!);
        const globalCallbacks = new LLMCallbacks(answerContext);

        const { output: answer } = await agent.call(
          { input: request },
          { callbacks: [globalCallbacks, lfCallback] },
        );
        const output = buildOutput(answer, answerContext.getSources());
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
