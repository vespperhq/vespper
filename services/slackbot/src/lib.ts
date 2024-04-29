import { GenericMessageEvent } from "@slack/bolt";
import { Roles, BotNames } from "./constants";
import { downloadFile } from "./utils/slack";
import { MessageElement } from "@slack/web-api/dist/response/ConversationsRepliesResponse";
import { ChatMessage } from "./types";

export function extractEventId(message: MessageElement) {
  const { name: botName } = message.bot_profile!;
  if (!BotNames.includes(botName!)) {
    throw new Error("Bot name not supported");
  }

  switch (botName) {
    case "Opsgenie for Alert Management": {
      if (!message.attachments || !message.attachments!.length) {
        throw new Error("No attachments found");
      }
      const attachment = message.attachments![0];
      const parts = attachment.title_link!.split("/");
      return parts[parts.length - 1];
    }
    default:
      throw new Error("Bot name not supported");
  }
}

/** This function parses a Slack message and transforms it to be
 * in OpenAI's format. We also takes care of images here.
 */
export async function parseMessage(
  message: GenericMessageEvent | MessageElement,
  botUserId: string,
  token: string,
): Promise<ChatMessage> {
  const botMentionString = `<@${botUserId}>`;
  const role = message.user === botUserId ? Roles.assistant : Roles.user;
  const text = message.text!.replace(botMentionString, "@Merlinn");

  const hasImage = message.files && message.files.length;
  if (!hasImage) {
    return { role, content: text };
  }
  const { url_private_download: url } = message.files![0];
  const buffer = (await downloadFile(token, url as string)) as Buffer;
  const base64Data = buffer.toString("base64");
  const imageFormat = url!.endsWith(".png") ? "png" : "jpeg";

  const dataUri = `data:image/${imageFormat};base64,${base64Data}`;
  return {
    role,
    content: [
      {
        type: "text",
        text,
      },
      {
        type: "image_url",
        image_url: {
          url: dataUri,
        },
      },
    ],
  };
}
