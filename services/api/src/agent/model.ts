import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbedding } from "llamaindex";

const apiKey = process.env.OPENAI_API_KEY;

export enum ModelName {
  GPT_3_5_TURBO_1106 = "gpt-3.5-turbo-1106",
  GPT_3_5_TURBO_0125 = "gpt-3.5-turbo-0125",
  GPT_4_VISION_PREVIEW = "gpt-4-vision-preview",
  GPT_4o = "gpt-4o-2024-05-13",
}

export const chatModel = new ChatOpenAI({
  modelName: ModelName.GPT_3_5_TURBO_1106,
  temperature: 0,
  openAIApiKey: apiKey,
  verbose: true,
});

export const visionModel = new ChatOpenAI({
  modelName: ModelName.GPT_4_VISION_PREVIEW,
  temperature: 0,
  openAIApiKey: apiKey,
  verbose: true,
  maxTokens: 300,
});

export const embedModel = new OpenAIEmbedding({
  apiKey,
  model: "text-embedding-3-large",
  dimensions: 768,
});
