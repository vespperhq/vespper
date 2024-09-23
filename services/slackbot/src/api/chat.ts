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
    `${process.env.API_URL}/chat/completions/slack`,
    {
      messages,
      metadata,
    },
    {
      headers: {
        "x-slack-app-token": process.env.SLACK_APP_TOKEN,
        "x-slack-email": email,
        "x-slack-team": team,
      },
    },
  );
  return response.data;
}

export const errorMap = {
  37: `Seems like you haven't created a knowledge graph yet :cry: You must create one so I'll be able to answer your questions.\nPlease go the <https://app.vespper.com|dashboard> to create one or visit our <https://docs.vespper.com|docs> to learn more.`,
  29: `Seems like you are not invited to use me :cry: Make sure an admin invites you, using your Slack email`,
  30: `Seems like you don't have access to the beta :cry:`,
  31: `Seems like you haven't accepted your invitation. Please go to your mailbox and accept it.`,
  32: `Seems like you haven't configured Slack yet 😊 Please go to the dashboard, configure Slack and try again`,
  35: `Your message seems to violate our terms of use.`,
  36: `You've exceeded your daily quota of questions. Please try again tommorow or upgrade your plan 😣`,
};
