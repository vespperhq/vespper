import { AgentExecutor } from "langchain/agents";
import {
  BufferMemory,
  BufferMemoryInput,
  ChatMessageHistory,
} from "langchain/memory";
import { RunnableSequence } from "langchain/schema/runnable";
import { formatToOpenAIToolMessages } from "langchain/agents/format_scratchpad/openai_tools";
import { formatToOpenAITool } from "langchain/tools";
import {
  OpenAIToolsAgentOutputParser,
  ToolsAgentStep,
} from "langchain/agents/openai/output_parser";
import { Tool } from "./tools/types";
import { ChatMessage } from "./types";
import { ChatPromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";

const createAgent = async (
  tools: Tool[],
  model: ChatOpenAI,
  template: ChatPromptTemplate,
  messages?: ChatMessage[],
) => {
  const _model = model.bind({ tools: tools.map(formatToOpenAITool) });

  const memoryParams = {
    returnMessages: true,
    memoryKey: "history",
  } as BufferMemoryInput;
  if (messages) {
    memoryParams.chatHistory = new ChatMessageHistory(messages);
  }

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
    _model,
    new OpenAIToolsAgentOutputParser(),
  ]).withConfig({ runName: "OpenAIToolsAgent" });

  return AgentExecutor.fromAgentAndTools({
    agent: agentSeq,
    tools,
    memory,
    maxIterations: 1,
  });
};

export { createAgent };
