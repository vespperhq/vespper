import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbedding } from "llamaindex";

const baseURL = process.env.LITELLM_URL;
const apiKey = "secret-key"; // This is a dummy variable. LiteLLM is the one responsible for the actual API key

export const chatModel = new ChatOpenAI({
  apiKey,
  configuration: { baseURL },
  modelName: "chat-model",
  temperature: 0,
  verbose: true,
});

// TODO: since we've switched to LiteLLM, we need to think what to do with this
// Right now, it's identical to the chat model above
export const visionModel = new ChatOpenAI({
  apiKey,
  configuration: { baseURL },
  modelName: "chat-model",
  temperature: 0,
  verbose: true,
  maxTokens: 300,
});

export const embedModel = new OpenAIEmbedding({
  apiKey,
  additionalSessionOptions: { baseURL },
  model: "embedding-model",
  dimensions: 768,
});
