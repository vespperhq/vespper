export enum EventType {
  message_sent = "message_sent",
  answer_created = "answer_created",
  user_registered = "user_registered",
  invitation_sent = "invitation_sent",
  organization_created = "organization_created",
  organization_deleted = "organization_deleted",
  invitation_accepted = "invitation_accepted",
}

export interface SystemEvent {
  type: EventType;
  payload: Record<string, string>;
}
