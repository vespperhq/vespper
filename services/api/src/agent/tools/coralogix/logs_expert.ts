import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { CoralogixIntegration } from "@merlinn/db";
import util from "util";
import { default as readLogs } from "./read_logs";
import { createAgent, lfCallback } from "../base";
import { DATAPRIME_CHEATSHEET } from "./constants";
import { getCommonLogFields } from "./utils";

const TOOL_LOADERS = [readLogs];

const PROMPT_TEMPLATE = `
You are a Coralogix logs expert. Your mission is to fetch logs, based on users requests.

At your disposal, you have a read_logs tool. Given a DataPrime query and a timeframe, it will try to fetch the logs from Coralogix.
DataPrime is a specialized query language that allows you to search logs in Coralogix.

Here is a cheatsheet of DataPrime query language:
${DATAPRIME_CHEATSHEET}

Here are the common fields that you can use in your query (they were taken from the environment itself):
%s

If you can't find the answer, please ask clarifying questions and get some help.
`;

const TOOL_DESCRIPTION = `
This tool serves as a Coralogix logs expert. Given a request in plain english, it will try to find the relevant logs.
Here are some examples that you can use:
- Please fetch the logs for the last 24 hours of service X
- Can you fetch the logs for service Y from the production environment?
`;

export default async function (integration: CoralogixIntegration) {
  const tools = await Promise.all(
    TOOL_LOADERS.map((loader) => loader(integration)),
  );
  const commonFields = await getCommonLogFields(
    integration.credentials.logsKey,
    integration.metadata.region,
  );
  const prompt = util.format(PROMPT_TEMPLATE, JSON.stringify(commonFields));
  const template = ChatPromptTemplate.fromMessages([
    ["ai", prompt],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createAgent(tools, template);

  return new DynamicStructuredTool({
    name: "coralogix_expert_tool",
    description: TOOL_DESCRIPTION,
    func: async ({ request }) => {
      try {
        const result = await agent.call(
          { input: request },
          { callbacks: [lfCallback] },
        );
        return result.output;
      } catch (error) {
        return JSON.stringify(error);
      }
    },
    schema: z.object({
      request: z.string().describe("The request to be used with Coralogix."),
    }),
  });
}
