import { AIMessage, HumanMessage } from "langchain/schema";
import { BaseMessage, ChatMessage } from "./types";

export function parseMessages(messages: BaseMessage[]): ChatMessage[] {
  return messages.map(({ content, role }) => {
    if (role === "assistant") {
      return new AIMessage({ content });
    }
    return new HumanMessage({ content });
  });
}
