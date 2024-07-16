import type { AlertEvent, EventSource } from "../../types/internal";
import { parseOpsgenieAlert, parsePagerDutyAlert } from "./parsers";
import { buildPrompt } from "./utils";

export async function parseAlertToPrompt(
  eventId: string,
  eventSource: EventSource,
  organizationId: string,
) {
  const event = await parseAlert(eventId, eventSource, organizationId);

  return buildPrompt(event);
}

export async function parseAlert(
  eventId: string,
  eventSource: EventSource,
  organizationId: string,
): Promise<AlertEvent> {
  switch (eventSource) {
    case "Opsgenie": {
      return parseOpsgenieAlert(eventId, organizationId);
    }
    case "PagerDuty": {
      return parsePagerDutyAlert(eventId, organizationId);
    }
    default: {
      throw new Error("Unsupported event source.");
    }
  }
}
