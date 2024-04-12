export type EventSource = "Opsgenie" | "PagerDuty";

export interface AlertEvent {
  message: string;
  source: EventSource;
  createdAt: string | number;
  data?: Record<string, unknown>;
}
