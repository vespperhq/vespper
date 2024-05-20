import express, { Request, Response } from "express";
import { MessageMetadata } from "@slack/bolt";
import type {
  IIntegration,
  OpsgenieIntegration,
  SlackIntegration,
} from "@merlinn/db";
import { integrationModel } from "@merlinn/db";
import { OpsgenieWebhookEvent } from "../../../types";
import { SlackClient } from "../../../clients/slack";
import { runAgent } from "../../../agent";
import { postInitialStatus } from "../utils";
import { parseAlertToPrompt } from "../../../services/alerts";
import {
  checkAlertsQuota,
  checkWebhookSecret,
} from "../../../middlewares/webhooks";
import { SystemEvent, EventType, events } from "../../../events";
import { investigationTemplate } from "../../../agent/prompts";
import { chatModel } from "../../../agent/model";
import { catchAsync } from "../../../utils/errors";
import { AppError, ErrorCode } from "../../../errors";
import { RunContext } from "../../../agent/types";
import { secretManager } from "../../../common/secrets";

const router = express.Router();

router.post(
  "/",
  checkWebhookSecret,
  checkAlertsQuota,
  catchAsync(async (req: Request, res: Response) => {
    const { organization } = req.webhook!;
    const organizationName = organization.name;
    const organizationId = String(organization._id);

    const event = req.body as OpsgenieWebhookEvent;

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
      throw new AppError("Opsgenie integration was not found", 500);
    } else if (!slackIntegration) {
      throw new AppError("Slack integration was not found", 500);
    }

    slackIntegration = (
      await secretManager.populateCredentials([slackIntegration])
    )[0] as SlackIntegration;

    const { access_token } = slackIntegration.credentials;
    const slackClient = new SlackClient(access_token);

    const { alert } = event;
    const { alertId } = alert;
    const { channel_id: channelId } =
      slackIntegration.metadata.incoming_webhook;
    const ogMessage = await slackClient.waitAndFetchMessage(channelId, alertId);

    await postInitialStatus(access_token, channelId, ogMessage.ts!);

    const prompt = await parseAlertToPrompt(
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
          context: "trigger-opsgenie",
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
        ts: ogMessage?.ts as string,
        text: answer,
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
