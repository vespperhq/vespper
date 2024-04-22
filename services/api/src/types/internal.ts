import { Types } from "mongoose";
export type EventSource = "Opsgenie" | "PagerDuty";

export interface AlertEvent {
  message: string;
  source: EventSource;
  createdAt: string | number;
  data?: Record<string, unknown>;
}

export interface EnrichedUser {
  _id: Types.ObjectId;
  auth0Id: string;
  status: "activated" | "invited";
  role: "owner" | "member";
  email: string;
  name: string;
  picture: string;
}
