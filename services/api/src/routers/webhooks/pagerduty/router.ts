import express, { Request, Response } from "express";
import { SlackClient } from "../../../clients";
import { runAgent } from "../../../agent";
import {
  IIntegration,
  PagerDutyIntegration,
  SlackIntegration,
  integrationModel,
} from "@merlinn/db";
import { MessageMetadata } from "@slack/bolt";
import { PagerDutyWebhookEvent } from "../../../types";
import { postInitialStatus } from "../utils";
import {
  checkAlertsQuota,
  checkWebhookSecret,
} from "../../../middlewares/webhooks";
import { checkPagerDutySignature } from "./utils";
import { parseAlertToPrompt } from "../../../services/alerts";
import { EventType, SystemEvent, events } from "../../../events";
import { investigationTemplate } from "../../../agent/prompts";
import { chatModel } from "../../../agent/model";
import { catchAsync } from "../../../utils/errors";
import { AppError, ErrorCode } from "../../../errors";
import { RunContext } from "../../../agent/types";
import { secretManager } from "../../../common/secrets";

const router = express.Router();

router.post(
  "/",
  checkPagerDutySignature,
  checkWebhookSecret,
  checkAlertsQuota,
  catchAsync(async (req: Request, res: Response) => {
    const { organization } = req.webhook!;
    const organizationName = organization.name;
    const organizationId = String(organization._id);

    const { event } = req.body as PagerDutyWebhookEvent;

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
      throw new AppError("Slack integration was not found", 500);
    } else if (!pagerdutyIntegration) {
      throw new AppError("PagerDuty integration was not found", 500);
    }

    slackIntegration = (
      await secretManager.populateCredentials([slackIntegration])
    )[0] as SlackIntegration;

    const { channel_id: channelId } =
      slackIntegration.metadata.incoming_webhook;
    const { access_token: slackToken } = slackIntegration.credentials;
    const slackClient = new SlackClient(slackToken);

    const prompt = await parseAlertToPrompt(
      event.data.id,
      "PagerDuty",
      String(organization._id),
    );

    const messages = await slackClient.getChannelHistoryGracefully(channelId);
    const pdMessage = messages?.find((message) =>
      message.text?.includes(event.data.id),
    );
    if (!pdMessage) {
      throw new AppError("Could not find Slack message", 500);
    }

    await postInitialStatus(slackToken, channelId, pdMessage.ts!);

    const context: RunContext = {
      organizationName,
      organizationId,
      env: process.env.NODE_ENV as string,
      eventId: event.data.id,
      context: "trigger-pagerduty",
    };
    try {
      const { answer, answerContext } = await runAgent({
        prompt,
        template: investigationTemplate,
        model: chatModel,
        integrations,
        context,
      });

      const traceId = answerContext.getTraceId()!;
      const traceURL = answerContext.getTraceURL()!;
      const observationId = answerContext.getObservationId()!;
      const event: SystemEvent = {
        type: EventType.answer_created,
        payload: {
          env: process.env.NODE_ENV as string,
          context: "trigger-pagerduty",
          traceId,
          observationId,
          traceURL,
          organizationName,
          organizationId,
        },
      };

      // Post a reply to the thread
      const metadata: MessageMetadata = {
        event_type: event.type,
        event_payload: event.payload,
      };

      const response = await slackClient.postReply({
        channelId,
        ts: pdMessage?.ts as string,
        text: answer.output,
        metadata,
      });

      const { ok, ts } = response;
      if (ok) {
        await slackClient.addFeedbackReactions(channelId, ts!);
      }
      events.emit(event.type, event);
      return res.status(200).send("ok");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new AppError(error.message, 500, ErrorCode.AGENT_RUN_FAILED);
    }
  }),
);

export { router };
