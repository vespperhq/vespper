import express, { Request, Response } from "express";
import { integrationModel } from "../../../db/models/integration";
import {
  IIntegration,
  OpsgenieIntegration,
  OpsgenieWebhookEvent,
  SlackIntegration,
} from "../../../types";
import { SlackClient } from "../../../clients/slack";
import { runAgent } from "../../../agent";
import { postInitialStatus } from "../utils";
import { parseAlertToPrompt } from "../../../services/alerts";
import {
  checkAlertsQuota,
  checkWebhookSecret,
} from "../../../middlewares/webhooks";
import { AnswerContext } from "../../../agent/callbacks";
import { SystemEvent, EventType, events } from "../../../events";
import { MessageMetadata } from "@slack/bolt";
import { investigationTemplate } from "../../../agent/prompts";
import { chatModel } from "../../../agent/model";
import { catchAsync } from "../../../utils/errors";
import { AppError, ErrorCode } from "../../../errors";
import { populateCredentials } from "../../../clients/secretManager";
import { RunContext } from "../../../agent/types";

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
      await populateCredentials([slackIntegration])
    )[0] as SlackIntegration;

    const { access_token } = slackIntegration.credentials;
    const slackClient = new SlackClient(access_token);

    const { alert } = event;
    const { alertId } = alert;
    const { channel_id: channelId } = slackIntegration.metadata;
    const ogMessage = await slackClient.waitAndFetchMessage(channelId, alertId);

    await postInitialStatus(access_token, channelId, ogMessage.ts!);

    const prompt = await parseAlertToPrompt(
      event.alert.alertId,
      "Opsgenie",
      String(organization._id),
    );

    const callback = async (answer: string, context: AnswerContext) => {
      const traceId = context.getTraceId()!;
      const traceURL = context.getTraceURL()!;
      const observationId = context.getObservationId()!;
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
    };

    const context: RunContext = {
      organizationName,
      organizationId,
      env: process.env.NODE_ENV as string,
      eventId: alertId,
      context: "trigger-opsgenie",
    };

    try {
      await runAgent({
        prompt,
        template: investigationTemplate,
        model: chatModel,
        integrations,
        callback,
        context,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new AppError(error.message, 500, ErrorCode.AGENT_RUN_FAILED);
    }

    return res.status(200).send("ok");
  }),
);

export { router };
