import { EventType, SystemEvent, events } from "../events";
import { EventListener } from "../events/listener";
import { notifier } from "./notifier";

export class NotificationsListener implements EventListener {
  listen = () => {
    // Notify to our slack channel about these events
    const eventTypes = [
      EventType.answer_created,
      EventType.user_registered,
      EventType.invitation_sent,
    ];
    eventTypes.forEach((type) => {
      events.on(type, this.handleEvent);
    });
  };

  async handleEvent(event: SystemEvent): Promise<void> {
    await notifier.notify(event);
  }
}

export const notificationsListener = new NotificationsListener();
