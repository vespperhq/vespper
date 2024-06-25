import { indexModel } from "@merlinn/db";
import { getVectorStore } from "../../agent/rag";
import type { AlertEvent, EventSource } from "../../types/internal";
import { parseOpsgenieAlert, parsePagerDutyAlert } from "./parsers";
import { buildPrompt } from "./utils";

export async function parseAlertToPrompt(
  eventId: string,
  eventSource: EventSource,
  organizationId: string,
) {
  const event = await parseAlert(eventId, eventSource, organizationId);

  const index = await indexModel.getOne({
    organization: organizationId,
  });

  if (index) {
    const vectorStore = getVectorStore(index.name, index.type);

    const relatedDocuments = await vectorStore.query({
      query: event.message,
      topK: 5,
      metadata: { source: eventSource },
    });
    const generalDocuments = await vectorStore.query({
      query: event.message,
      topK: 5,
    });

    const context = `
    ${
      relatedDocuments.length &&
      `
    Context:
    Related incidents/alerts from history:
    ${relatedDocuments.map((doc) => doc.text).join("\n")}
    `
    }

    ${
      generalDocuments.length &&
      `
    General information about the incident/alert:
    ${generalDocuments.map((doc) => doc.text).join("\n")}
    `
    }
    `;
    return buildPrompt(event, context);
  }

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
