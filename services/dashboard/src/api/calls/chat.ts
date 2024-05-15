import { AxiosInstance } from "axios";
import { ChatMessage } from "../../types/chat";

interface CompletionParams {
  messages: ChatMessage[];
  metadata?: Record<string, string>;
}

export async function getCompletion(
  axios: AxiosInstance,
  { messages, metadata }: CompletionParams,
) {
  const response = await axios.post(`/chat/completions/general`, {
    messages,
    metadata,
  });
  return response.data;
}
