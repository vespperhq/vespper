import { SlackClient } from "../clients";
import { isURL } from "../utils/strings";
import { SystemEvent } from "../events";

class Notifier {
  private readonly client: SlackClient;
  private readonly channelId: string;
  constructor() {
    this.client = new SlackClient(process.env.SLACK_NOTIFIER_TOKEN as string);
    this.channelId = process.env.SLACK_EVENTS_CHANNEL_ID as string;
  }

  notify = async (event: SystemEvent) => {
    try {
      const data = Object.entries(event.payload)
        .map(([key, value]) => {
          const newValue = isURL(value) ? `<${value}|Click here>` : value;
          return `\`${key}\`: ${newValue}`;
        })
        .join("\n");

      const attachments = [
        {
          color: "#A842F1",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Event*: ${event.type}\n*Data*: \n${data}`,
              },
            },
          ],
        },
      ];
      await this.client.postMessage({
        channelId: this.channelId,
        attachments,
        text: `New Event: ${event.type}`,
      });
    } catch (error) {
      console.log("Failed to notify");
      console.log(error);
    }
  };
}

export const notifier = new Notifier();
