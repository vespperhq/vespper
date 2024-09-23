export function isEnterprise() {
  return !!process.env.VESPPER_CLOUD_REGION;
}

export function isDev() {
  return process.env.NODE_ENV === "development";
}

export const Roles = {
  user: "user",
  system: "system",
  assistant: "assistant",
};

export const BotNames = ["Opsgenie for Alert Management"];

export const SCOPES = [
  "app_mentions:read",
  "channels:history",
  "channels:join",
  "channels:read",
  "chat:write",
  "files:read",
  "im:history",
  "incoming-webhook",
  "metadata.message:read",
  "reactions:read",
  "reactions:write",
  "users.profile:read",
  "users:read",
  "users:read.email",
];

export const WELCOME_MESSAGE = `
Hello, <@%s>! :wave: How can I help you?

**Tip**: use \`/help\` if you need assistance.
`;

export const HELP_MESSAGE = `
Hi <@%s>! I'm Vespper 🧙‍♂️, your AI assistant for all your production questions.
You can simply talk to me in this chat and I'll do my best to help you out.

For example, you can ask me questions like:
- "Do you see any errors in the logs?"
- "What's the status of the X service?"
- "Can you fetch the logs for service Y from the staging environment and check if there are any errors?"

Moreover, here are some pre-defined commands you can use:
- \`/vespper help\`: Shows this help message
- \`/vespper new-chat\`: Resets the chat history
- \`/vespper actions\`: Shows available, pre-defined actions
`;
