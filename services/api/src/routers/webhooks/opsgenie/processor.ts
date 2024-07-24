import {
  IIntegration,
  IWebhook,
  OpsgenieIntegration,
  SlackIntegration,
  integrationModel,
} from "@merlinn/db";
import { OpsgenieWebhookEvent } from "../../../types";
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
  event: OpsgenieWebhookEvent,
) {
  const { organization } = webhook;
  const organizationName = organization.name;
  const organizationId = String(organization._id);

  // Make sure we have the basic integrations to perform an investigation.
  const integrations = (await integrationModel
    .get({
      organization: organization._id,
    })
    .populate("vendor")) as IIntegration[];

  let slackIntegration = integrations.find(
    (integration) => integration.vendor.name === "Slack",
  ) as SlackIntegration;
  const opsgenieIntegration = integrations.find(
    (integration) => integration.vendor.name === "Opsgenie",
  ) as OpsgenieIntegration;
  if (!opsgenieIntegration) {
    throw new Error("Opsgenie integration was not found");
  } else if (!slackIntegration) {
    throw new Error("Slack integration was not found");
  }

  slackIntegration = (
    await secretManager.populateCredentials([slackIntegration])
  )[0] as SlackIntegration;

  const { access_token } = slackIntegration.credentials;
  const slackClient = new SlackClient(access_token);

  const { alert } = event;
  const { alertId } = alert;
  const channelId = opsgenieIntegration.settings.slackChannelId as string;
  const ogMessage = await slackClient.waitAndFetchMessage(channelId, alertId);

  await postInitialStatus(access_token, channelId, ogMessage.ts!);

  try {
    const analysis = await runRCA(
      event.alert.alertId,
      "Opsgenie",
      String(organization._id),
    );

    const context: RunContext = {
      organizationName,
      organizationId,
      env: process.env.NODE_ENV as string,
      eventId: alertId,
      context: "trigger-opsgenie",
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
        context: "trigger-opsgenie",
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
      ts: ogMessage?.ts as string,
      text: analysis,
      metadata,
    });
    const { ok, ts } = response;
    if (ok) {
      await slackClient.addFeedbackReactions(channelId, ts!);
    }
  } catch (error) {
    await slackClient.postReply({
      channelId,
      ts: ogMessage?.ts as string,
      text: "An error occurred while processing the event, and the investigation could not be completed.",
    });

    throw error;
  }
}
