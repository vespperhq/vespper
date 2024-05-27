import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { default as semanticSearch } from "../static/semantic_search";
import { createAgent } from "./base";
import { RunContext } from "../../../agent/types";

const TOOL_LOADERS = [semanticSearch];

const PROMPT = `
You are a smart a knowledge base expert. Your mission is to help users find the most relevant information from the knowledge base.
Given a query/question, you should try to find the most relevant information from the knowledge base and provide the answer to the user.

At your disposal, you have a search tool that can help you find the most relevant information from the knowledge base.
If you can't find the answer right away, you can do multiple searches to find the most relevant information.

If you still can't find the answer, you can ask for help.
`;

export default async function (context: RunContext) {
  const tools = await Promise.all(
    TOOL_LOADERS.map((loader) => loader(context)),
  );
  const template = ChatPromptTemplate.fromMessages([
    ["ai", PROMPT],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createAgent(tools, template);

  return new DynamicStructuredTool({
    name: "knowledge_base_expert_tool",
    description: `This tool serves as a knowledge base expert. Given a question/query, it will try to find the most relevant information from the knowledge base.`,
    func: async ({ query }) => {
      try {
        const result = await agent.call({ input: query });
        return result.output;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return JSON.stringify(error);
      }
    },
    schema: z.object({
      query: z
        .string()
        .describe(
          "The query/question to be used to search the knowledge base.",
        ),
    }),
  });
}
