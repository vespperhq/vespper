import { AgentExecutor } from "langchain/agents";
import { BufferMemory, BufferMemoryInput } from "langchain/memory";
import { RunnableSequence } from "langchain/schema/runnable";
import { formatToOpenAITool } from "langchain/tools";
import { formatToOpenAIToolMessages } from "langchain/agents/format_scratchpad/openai_tools";
import {
  OpenAIToolsAgentOutputParser,
  ToolsAgentStep,
} from "langchain/agents/openai/output_parser";
import { Tool } from "../tools/types";
import { ChatPromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ModelName } from "../model";

export const createAgent = async (
  tools: Tool[],
  template: ChatPromptTemplate,
) => {
  const apiKey = process.env.OPENAI_API_KEY;

  const model = new ChatOpenAI({
    modelName: ModelName.GPT_3_5_TURBO_0125,
    // modelName: ModelName.GPT_4o,
    temperature: 0,
    openAIApiKey: apiKey,
    verbose: true,
  }).bind({ tools: tools.map(formatToOpenAITool) });

  const memoryParams = {
    returnMessages: true,
    memoryKey: "history",
  } as BufferMemoryInput;
  //   if (messages) {
  //     memoryParams.chatHistory = new ChatMessageHistory(messages);
  //   }

  const memory = new BufferMemory(memoryParams);
  const agentSeq = RunnableSequence.from([
    {
      input: (i: { input: string; steps: ToolsAgentStep[] }) => i.input,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      agent_scratchpad: (i: { input: string; steps: ToolsAgentStep[] }) =>
        formatToOpenAIToolMessages(i.steps),
      history: () => memory.chatHistory.getMessages(),
    },
    template,
    model,
    new OpenAIToolsAgentOutputParser(),
  ]).withConfig({ runName: "OpenAIToolsAgent" });

  return AgentExecutor.fromAgentAndTools({
    agent: agentSeq,
    tools,
    memory,
    maxIterations: 3,
  });
};
