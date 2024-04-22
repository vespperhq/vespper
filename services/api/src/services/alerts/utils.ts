import { getDistance } from "../../utils/dates";
import type { AlertEvent } from "../../types/internal";

export const buildPrompt = (event: AlertEvent, context?: string) => {
  const alertDate = new Date(event.createdAt);
  return `
  New alert has been triggered! Details:

  Title: ${event.message}
  Source: ${event.source}
  Time: ${getDistance(alertDate)}
  Additional information: ${JSON.stringify(event.data)}

  ${
    context
      ? `Here are some search results from the company's knowledge base about this alert: \n: ${context}`
      : ""
  }
  `;
};
