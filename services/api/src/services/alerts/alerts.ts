// import { semanticSearch } from "../../agent/rag";
import type { AlertEvent, EventSource } from "../../types/internal";
import { parseOpsgenieAlert, parsePagerDutyAlert } from "./parsers";
import { buildPrompt } from "./utils";

export async function parseAlertToPrompt(
  eventId: string,
  eventSource: EventSource,
  organizationId: string,
) {
  const event = await parseAlert(eventId, eventSource, organizationId);
  // const context = (await semanticSearch(
  //   event.message,
  //   organizationId,
  //   5,
  //   true,
  // )) as string;
  // const prompt = buildPrompt(event, context);
  const prompt = buildPrompt(event);
  return prompt;
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
