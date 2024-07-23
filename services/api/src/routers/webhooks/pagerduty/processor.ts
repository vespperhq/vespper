import {
  IIntegration,
  IWebhook,
  PagerDutyIntegration,
  SlackIntegration,
  integrationModel,
} from "@merlinn/db";
import { PagerDutyWebhookEvent } from "../../../types";
import { secretManager } from "../../../common/secrets";
import { SlackClient } from "../../../clients";
import { postInitialStatus } from "../utils";
import { runRCA } from "../../../services/rca";
import { RunContext } from "../../../agent/types";
import { isLangfuseEnabled } from "../../../utils/ee";
import { generateTrace } from "../../../agent/helper";
import { EventType, SystemEvent, events } from "../../../events";
import { MessageMetadata } from "@slack/bolt";

export async function processWebhook(
  webhook: IWebhook,
  event: PagerDutyWebhookEvent,
) {
  const { organization } = webhook;
  const organizationName = organization.name;
  const organizationId = String(organization._id);

  const { event: pdEvent } = event;

  const integrations = (await integrationModel
    .get({
      organization: organization._id,
    })
    .populate("vendor")) as IIntegration[];

  // Get integrations to Slack and PagerDuty
  let slackIntegration = integrations.find(
    (integration) => integration.vendor.name === "Slack",
  ) as SlackIntegration;
  const pagerdutyIntegration = integrations.find(
    (integration) => integration.vendor.name === "PagerDuty",
  ) as PagerDutyIntegration;

  if (!slackIntegration) {
    throw new Error("Slack integration was not found");
  } else if (!pagerdutyIntegration) {
    throw new Error("PagerDuty integration was not found");
  }

  slackIntegration = (
    await secretManager.populateCredentials([slackIntegration])
  )[0] as SlackIntegration;

  const channelId = pagerdutyIntegration.settings.slackChannelId as string;

  const { access_token: slackToken } = slackIntegration.credentials;
  const slackClient = new SlackClient(slackToken);

  const messages = await slackClient.getChannelHistoryGracefully(channelId);
  const pdMessage = messages?.find((message) =>
    message.text?.includes(pdEvent.data.id),
  );
  if (!pdMessage) {
    throw new Error("Could not find Slack message");
  }

  await postInitialStatus(slackToken, channelId, pdMessage.ts!);

  const analysis = await runRCA(
    pdEvent.data.id,
    "PagerDuty",
    String(organization._id),
  );

  const context: RunContext = {
    organizationName,
    organizationId,
    env: process.env.NODE_ENV as string,
    eventId: pdEvent.data.id,
    context: "trigger-pagerduty",
  };
  if (isLangfuseEnabled()) {
    const trace = generateTrace({ ...context });
    context.trace = trace;
  }

  const systemEvent: SystemEvent = {
    type: EventType.answer_created,
    entityId: String(organization._id),
    payload: {
      organizationId,
      organizationName,
      env: process.env.NODE_ENV as string,
      context: "trigger-pagerduty",
    },
  };

  events.publish(systemEvent);

  // Post a reply to the thread
  const metadata: MessageMetadata = {
    event_type: systemEvent.type,
    event_payload: systemEvent.payload,
  };

  const response = await slackClient.postReply({
    channelId,
    ts: pdMessage?.ts as string,
    text: analysis,
    metadata,
  });

  const { ok, ts } = response;
  if (ok) {
    await slackClient.addFeedbackReactions(channelId, ts!);
  }
}
