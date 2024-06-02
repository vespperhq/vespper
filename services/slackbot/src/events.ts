import { App } from "@slack/bolt";
import util from "util";
import { WELCOME_MESSAGE } from "./constants";
import { getMyId } from "./utils/slack";
import { CustomEventPayload } from "./types";
import { sendFeedback } from "./api/feedback";

export function attachEvents(app: App) {
  app.event("app_home_opened", async ({ event, say, client }) => {
    // Fetch the first message in the conversation
    const response = await client.conversations.history({
      channel: event.channel,
      inclusive: true,
      limit: 1,
    });
    if (!response.messages?.length) {
      await say(util.format(WELCOME_MESSAGE, event.user));
    }
  });

  app.event("reaction_added", async ({ event, client }) => {
    const botUserId = await getMyId(client);
    const reactions = ["+1", "-1"];
    if (event.item_user !== botUserId || event.user === botUserId) {
      return;
    } else if (!reactions.includes(event.reaction)) {
      return;
    }
    const user = await client.users.profile.get({ user: event.user });

    try {
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
}
