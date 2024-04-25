import type { View, WebClient } from "@slack/web-api";
import axios from "axios";

export async function getMyId(client: WebClient) {
  const response = await client.auth.test();
  return response.user_id;
}

export async function addReaction(
  client: WebClient,
  channel: string,
  timestamp: string,
  name: string,
) {
  try {
    return await client.reactions.add({
      channel,
      timestamp,
      name,
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
}

export async function addFeedbackReactions(
  client: WebClient,
  channel: string,
  timestamp: string,
) {
  try {
    await Promise.all([
      addReaction(client, channel, timestamp, "thumbsup"),
      addReaction(client, channel, timestamp, "thumbsdown"),
    ]);
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
}

export async function openModal(
  client: WebClient,
  trigger_id: string,
  view: View,
) {
  await client.views.open({
    trigger_id,
    view,
  });
}

export async function downloadFile(botToken: string, url: string) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${botToken}` },
    };
    const response = await axios.get(url, {
      responseType: "stream",
      headers: config.headers,
    });
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      response.data.on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      });

      response.data.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      response.data.on("error", (err: unknown) => {
        reject(err);
      });
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
