import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate } from "langchain/prompts";
import { AIMessage, HumanMessage, MessageContent } from "langchain/schema";
import type { IIntegration } from "@merlinn/db";
import { LangfuseTraceClient } from "langfuse";

// Langchain helper types
export type ChatMessage = AIMessage | HumanMessage;
export interface TextBlock {
  type: "text";
  text: string;
}

export interface ImageBlock {
  type: "image_url";
  image_url:
    | string
    | {
        url: string;
        detail?: "auto" | "low" | "high";
      };
}

export interface BaseMessage {
  role: string;
  content: MessageContent;
}

// Run Agent/Model types
export interface RunContext {
  trace?: LangfuseTraceClient;
  email?: string;
  userId?: string;
  eventId?: string;
  env: string;
  organizationName: string;
  organizationId: string;
  context: string;
}

export interface RunAgentParams {
  prompt: string;
  model: ChatOpenAI;
  template: ChatPromptTemplate;
  integrations: IIntegration[];
  context: RunContext;
  messages?: ChatMessage[];
}

export interface RunModelParams {
  model: ChatOpenAI;
  template: ChatPromptTemplate;
  context: RunContext;
  messages: ChatMessage[];
}
