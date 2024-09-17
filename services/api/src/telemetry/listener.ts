import { EventType, SystemEvent, events } from "../events";
import { EventListener } from "../events/listener";
import { PostHogClient } from "./posthog";

export class TelemetryListener implements EventListener {
  private readonly client: PostHogClient;
  constructor() {
    this.client = new PostHogClient();
  }

  listen = () => {
    const eventTypes = [
      EventType.answer_created,
      EventType.user_registered,
      EventType.invitation_sent,
      EventType.invitation_accepted,
      EventType.organization_created,
      EventType.organization_deleted,
    ];
    eventTypes.forEach((type) => {
      events.on(type, this.handleEvent);
    });
  };

  handleEvent = async (event: SystemEvent): Promise<void> => {
    const { type, payload, entityId } = event;
    this.client.capture({
      event: type,
      distinctId: entityId,
      properties: payload,
    });
    await this.client.shutdown();
  };
}
