import { EventType, SystemEvent, events } from "../events";
import { EventListener } from "../events/listener";
import { MixpanelClient } from "./mixpanel";

export class AnalyticsListener implements EventListener {
  private readonly client: MixpanelClient;
  constructor() {
    this.client = new MixpanelClient(
      process.env.MIXPANEL_PROJECT_TOKEN as string,
    );
  }
  listen = () => {
    // Send data to mixpanel
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

  handleEvent = (event: SystemEvent): void => {
    this.client.track(event.type, event.payload);
  };
}

export const analyticsListener = new AnalyticsListener();
