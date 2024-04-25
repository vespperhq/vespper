import { App, GenericMessageEvent } from "@slack/bolt";
import { getMyId, addFeedbackReactions, addReaction } from "./utils/slack";
import { getCompletion } from "./api/chat";
import { extractEventId, parseMessage } from "./lib";
import { BotNames } from "./constants";
import { sendFeedback } from "./api/feedback";
import { CustomEventPayload } from "./types";

// Initializes your app with your bot token and signing secret.
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: ["chat:write"],
  socketMode: true, // enable the following to use socket mode
  appToken: process.env.APP_TOKEN,
  installationStore: {
    fetchInstallation: async (installQuery) => {
      // Bolt will pass your handler an installQuery object
      // Change the lines below so they fetch from your database
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        // handle org wide app installation lookup
        // return await database.get(installQuery.enterpriseId);
        return null;
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        // return await database.get(installQuery.teamId);
        return null;
      }
      throw new Error("Failed fetching installation");
    },
  },
});

app.event("reaction_added", async ({ event, client }) => {
  try {
    const botUserId = await getMyId(client);
    const reactions = ["+1", "-1"];
    if (event.item_user !== botUserId) {
      return;
    } else if (!reactions.includes(event.reaction)) {
      return;
    }
    const user = await client.users.profile.get({ user: event.user });

    const response = await client.conversations.replies({
      channel: event.item.channel,
      ts: event.item.ts,
      include_all_metadata: true,
    });
    if (!response.messages) {
      console.log("No messages found");
      return;
    } else if (!response.messages[0].metadata) {
      console.log("No metadata found");
      return;
    }

    const message = response.messages[0];
    const { event_type, event_payload } = message.metadata!;
    if (event_type !== "answer_created") {
      console.log("Not a valid auto-generated message");
      return;
    }

    const { trace_id, observation_id } = event_payload as CustomEventPayload;
    const value = event.reaction === "+1" ? 1 : -1;
    await sendFeedback({
      traceId: trace_id,
      observationId: observation_id,
      email: user.profile!.email!,
      team: message.team!,
      value,
    });
  } catch (error) {
    console.log(error);
  }
});

app.message(async ({ message: msg, say, client }) => {
  const message = msg as GenericMessageEvent;
  const user = await client.users.profile.get({ user: message.user });

  try {
    const botUserId = await getMyId(client);
    const botMentionString = `<@${botUserId}>`;

    // Check if the bot is mentioned in the message or a user has sent a direct message
    if (!message.text) {
      return;
    } else if (
      message.channel_type !== "im" &&
      !message.text.includes(botMentionString)
    ) {
      return;
    }

    // Add eyes reaction
    await addReaction(client, message.channel, message.ts, "eyes");

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
        historyResponse.messages.map((msg) => parseMessage(msg, botUserId!)),
      );
    } else {
      // We use Promise.all here since we want to build an array with a single value.
      messages = await Promise.all([parseMessage(message, botUserId!)]);
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
      thread_ts: message.thread_ts, // Use the thread timestamp if available
      metadata: message_metadata,
    });
    const { ok, channel, ts } = response;
    if (ok && channel && ts) {
      await addFeedbackReactions(client, channel, ts);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("error: ", error);
    if (error.response && error.response.status === 404) {
      if (error.response.data.code === 37) {
        client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: message.channel,
          user: message.user,
          text: `Seems like you haven't created a knowledge graph yet :cry: You must create one so I'll be able to answer your questions.\nPlease go the <https://app.merlinn.co|dashboard> to create one or visit our <https://docs.merlinn.co|docs> to learn more.`,
          thread_ts: message.thread_ts,
        });
      }
    } else if (error.response && error.response.status === 403) {
      if (error.response.data.code === 29) {
        client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: message.channel,
          user: message.user,
          text: `Seems like you are not invited to use me :cry: Make sure an admin invites you, using your email: ${user.profile?.email}`,
          thread_ts: message.thread_ts,
        });
      } else if (error.response.data.code === 30) {
        client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: message.channel,
          user: message.user,
          text: `Seems like you don't have access to the beta :cry:`,
          thread_ts: message.thread_ts,
        });
      } else if (error.response.data.code === 31) {
        client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: message.channel,
          user: message.user,
          text: `Seems like you haven't accepted your invitation. Please go to your mailbox and accept it.`,
          thread_ts: message.thread_ts,
        });
      }
    } else if (error.response && error.response.status === 401) {
      if (error.response.data.code === 32) {
        client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: message.channel,
          user: message.user,
          text: `Seems like you haven't configured Slack yet 😊 Please go to the dashboard, configure Slack and try again`,
          thread_ts: message.thread_ts,
        });
      }
    } else if (error.response?.status === 400) {
      if (error.response.data.code === 35) {
        client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: message.channel,
          user: message.user,
          text: `Your message seems to violate our terms of use.`,
          thread_ts: message.thread_ts,
        });
      }
    } else if (error.response && error.response.status === 429) {
      if (error.response.data.code === 36) {
        client.chat.postEphemeral({
          token: process.env.SLACK_BOT_TOKEN,
          channel: message.channel,
          user: message.user,
          text: `You've exceeded your daily quota of questions. Please try again tommorow 😣`,
          thread_ts: message.thread_ts,
        });
      }
    } else {
      await say({
        text: "I'm really sorry but there's an unexpected problem and I'm currently unavailable",
        thread_ts: message.thread_ts, // Use the thread timestamp if available
      });
    }
  }
});

init();

async function init() {
  const port = process.env.PORT || 3000;
  // Start your app
  try {
    await app.start(port);
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
  } catch (error) {
    console.error("Error starting the Slack Bolt app:", error);
  }
}
