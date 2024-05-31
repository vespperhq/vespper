import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { CoralogixIntegration } from "@merlinn/db";
import { default as logsExpertTool } from "./logs_expert";
import { createAgent, lfCallback } from "../base";

const TOOL_LOADERS = [logsExpertTool];

const PROMPT = `
You are a Coralogix expert. Your mission is to answer users' requests and provide the information they need.
Given a request from users, you should try to find the most relevant information from Coralogix.

At your disposal, you have several tools that can fetch data from Coralogix.

If you can't find the answer, please ask clarifying questions and get some help.
`;

const DESCRIPTION = `
This tool serves as a Coralogix expert. Given a request in plain english, it will try to find the most relevant information and provide the answer to the user.
Here are some examples that you can use:
- Please fetch the logs for the last 24 hours of service X
- Can you check any anomalies in the logs for service Y?
- Are there any active alerts for service Z?
`;

export default async function (integration: CoralogixIntegration) {
  const tools = await Promise.all(
    TOOL_LOADERS.map((loader) => loader(integration)),
  );
  const template = ChatPromptTemplate.fromMessages([
    ["ai", PROMPT],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createAgent(tools, template);

  return new DynamicStructuredTool({
    name: "coralogix_expert_tool",
    description: DESCRIPTION,
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
