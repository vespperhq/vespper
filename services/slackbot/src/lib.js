const { Roles, BotNames } = require("./constants");
const { downloadFile } = require("./utils/slack");
// const { getMetadata, resize } = require("./utils/images");

function extractEventId(message) {
  const { name: botName } = message.bot_profile;
  if (!BotNames.includes(botName)) {
    throw new Error("Bot name not supported");
  }

  switch (botName) {
    case "Opsgenie for Alert Management": {
      const parts = message.attachments[0].title_link.split("/");
      return parts[parts.length - 1];
    }
  }
}

/** This function parses a Slack message and transforms it to be
 * in OpenAI's format. We also takes care of images here.
 */
async function parseMessage(message, botUserId) {
  const botMentionString = `<@${botUserId}>`;
  const role = message.user === botUserId ? Roles.assistant : Roles.user;
  const text = message.text.replace(botMentionString, "@Merlinn");

  const hasImage = message.files && message.files.length;
  if (!hasImage) {
    return { role, content: text };
  }
  const { url_private_download: url } = message.files[0];
  const buffer = await downloadFile(process.env.SLACK_BOT_TOKEN, url);
  const base64Data = buffer.toString("base64");
  const imageFormat = url.endsWith(".png") ? "png" : "jpeg";

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

module.exports = { extractEventId, parseMessage };
