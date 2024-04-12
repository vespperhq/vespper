import { SlackClient } from "../../clients/slack";

export async function postInitialStatus(
  token: string,
  channelId: string,
  ts: string,
) {
  const slackClient = new SlackClient(token);
  try {
    await slackClient.addReaction(channelId, ts, "eyes");
    await slackClient.postReply({
      channelId,
      ts,
      text: `Starting initial investigation. It should take up to a minute.\n*Tip:* Help me be more useful by leaving :thumbsup: or :thumbsdown: on my answers!`,
    });
  } catch (error) {
    console.log(error);
  }
}
