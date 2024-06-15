import { Types } from "mongoose";
export type EventSource = "Opsgenie" | "PagerDuty" | "Alert Manager";

export interface AlertEvent {
  message: string;
  source: EventSource;
  createdAt: string | number;
  data?: Record<string, unknown>;
}

export interface EnrichedUser {
  _id: Types.ObjectId;
  oryId: string;
  status: "activated" | "invited";
  role: "owner" | "member";
  email: string;
  name: string;
  picture: string;
}
