import { App, GenericMessageEvent } from "@slack/bolt";
import { addFeedbackReactions, addReaction, getMyId } from "./utils/slack";
import { BotNames } from "./constants";
import { extractEventId, parseMessage } from "./lib";
import { getCompletion } from "./api/chat";

export function attachMessages(app: App) {
  app.message(async ({ message: msg, say, client }) => {
    // There is a known issue with Bolt.js message params in TypeScript.
    // https://github.com/slackapi/bolt-js/issues/904
    // The solution in the meantime is to cast the message to Casting to GenericMessageEvent
    console.log("Received message!");
    const message = msg as GenericMessageEvent;

    const botUserId = await getMyId(client);
    console.log("Got id:");
    const botMentionString = `<@${botUserId}>`;

    // Check if the bot is mentioned in the message or a user has sent a direct message
    if (!message.text) {
      return;
    } else if (
      message.channel_type !== "im" &&
      !message.text.includes(botMentionString)
    ) {
      return;
    } else if (message.user === botUserId) {
      return;
    }

    // Add eyes reaction
    await addReaction(client, message.channel, message.ts, "eyes");

    const user = await client.users.profile.get({ user: message.user });

    try {
      let messages;
      const metadata = {} as { eventId: string };
      if (message.thread_ts) {
        const historyResponse = await client.conversations.replies({
          channel: message.channel,
          ts: message.thread_ts,
          inclusive: true,
        });
        if (!historyResponse.messages) {
          console.log("No messages found");
          throw new Error("No messages found");
        }
        const firstMessage = historyResponse.messages[0];
        if (
          firstMessage.bot_profile &&
          BotNames.includes(firstMessage.bot_profile.name!)
        ) {
          const eventId = extractEventId(firstMessage);
          metadata.eventId = eventId;
        }
        messages = await Promise.all(
          historyResponse.messages.map((msg) =>
            parseMessage(msg, botUserId!, client.token!),
          ),
        );
      } else {
        // We use Promise.all here since we want to build an array with a single value.
        messages = await Promise.all([
          parseMessage(message, botUserId!, client.token!),
        ]);
      }

      if (!user.profile) {
        throw new Error("User profile not found");
      }
      const { email } = user.profile;
      const { team } = message;
      if (!email || !team) {
        throw new Error("Email or team not found");
      }

      const { output, traceId, observationId } = await getCompletion({
        messages,
        email,
        team,
        metadata,
      });

      const message_metadata = {
        event_type: "answer_created",
        event_payload: {
          trace_id: traceId,
          observation_id: observationId,
        },
      };

      const response = await say({
        text: output,
        thread_ts: message.thread_ts || message.ts, // Use the thread timestamp if available
        metadata: message_metadata,
      });
      const { ok, channel, ts } = response;
      if (ok && channel && ts) {
        await addFeedbackReactions(client, channel, ts);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // TODO: Need to organize this mess of error handling
      console.error("error: ", error.message);
      let messageText;
      if (error.response?.status === 404 && error.response?.data.code === 37) {
        messageText = `Seems like you haven't created a knowledge graph yet :cry: You must create one so I'll be able to answer your questions.\nPlease go the <https://app.merlinn.co|dashboard> to create one or visit our <https://docs.merlinn.co|docs> to learn more.`;
      } else if (error.response?.status === 403) {
        if (error.response.data.code === 29) {
          messageText = `Seems like you are not invited to use me :cry: Make sure an admin invites you, using your email: ${user.profile?.email}`;
        } else if (error.response.data.code === 30) {
          messageText = `Seems like you don't have access to the beta :cry:`;
        } else if (error.response.data.code === 31) {
          messageText = `Seems like you haven't accepted your invitation. Please go to your mailbox and accept it.`;
        }
      } else if (
        error.response?.status === 401 &&
        error.response?.data.code === 32
      ) {
        messageText = `Seems like you haven't configured Slack yet 😊 Please go to the dashboard, configure Slack and try again`;
      } else if (
        error.response?.status === 400 &&
        error.response?.data.code === 35
      ) {
        messageText = `Your message seems to violate our terms of use.`;
      } else if (
        error.response?.status === 429 &&
        error.response?.data.code === 36
      ) {
        messageText = `You've exceeded your daily quota of questions. Please try again tommorow or upgrade your plan 😣`;
      } else {
        messageText =
          "I'm really sorry but there's an unexpected problem and I'm currently unavailable";
      }
      client.chat
        .postEphemeral({
          channel: message.channel,
          user: message.user,
          text: messageText,
          thread_ts: message.thread_ts,
        })
        .catch((error) => {
          console.error(error);
        });
    }
  });
}
