import axios from "axios";
import { ChatMessage } from "../types";

interface CompletionParams {
  messages: ChatMessage[];
  email: string;
  team: string;
  metadata?: Record<string, string>;
}
export async function getCompletion({
  messages,
  email,
  team,
  metadata,
}: CompletionParams) {
  const response = await axios.post(
    `${process.env.API_BASE_URL}/chat/completions`,
    {
      messages,
      metadata,
    },
    {
      headers: {
        "x-slack-app-token": process.env.APP_TOKEN,
        "x-slack-email": email,
        "x-slack-team": team,
      },
    },
  );
  return response.data;
}
