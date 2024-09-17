import { App } from "@slack/bolt";
import util from "util";
import { HELP_MESSAGE } from "./constants";

export function attachCommands(app: App) {
  app.command("/merlinn", async ({ ack, say, command, client }) => {
    await ack();

    switch (command.text) {
      case "help": {
        await say(util.format(HELP_MESSAGE, command.user_id));
        break;
      }
      case "new-chat": {
        const message =
          command.channel_name !== "directmessage"
            ? "You cannot reset chat history when you're outside of direct messaging."
            : "Chat history has been reset. You can now start a new conversation!";
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: message,
        });
        break;
      }
      default:
        await say(
          "Invalid command 😕 You can run `/merlinn help` to see all the available commands",
        );
    }
  });
}
