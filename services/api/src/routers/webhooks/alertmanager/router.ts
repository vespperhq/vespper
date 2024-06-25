import express, { Request, Response } from "express";
import { MessageMetadata } from "@slack/bolt";
import type {
  IIntegration,
  PrometheusIntegration,
  SlackIntegration,
} from "@merlinn/db";
import { integrationModel } from "@merlinn/db";
import { AlertManagerWebhookEvent } from "../../../types";
import { SlackClient } from "../../../clients/slack";
import { runAgent } from "../../../agent";
import { postInitialStatus } from "../utils";
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
import { AlertEvent } from "../../../types/internal";
import { buildPrompt } from "../../../services/alerts/utils";
import { generateTrace } from "../../../agent/helper";
import { isLangfuseEnabled } from "../../../utils/ee";

const router = express.Router();

router.post(
  "/",
  checkWebhookSecret,
  checkAlertsQuota,
  catchAsync(async (req: Request, res: Response) => {
    const { organization } = req.webhook!;
    const organizationName = organization.name;
    const organizationId = String(organization._id);

    const event = req.body as AlertManagerWebhookEvent;

    // Make sure we have the basic integrations to perform an investigation.
    const integrations = (await integrationModel
      .get({
        organization: organization._id,
      })
      .populate("vendor")) as IIntegration[];

    let slackIntegration = integrations.find(
      (integration) => integration.vendor.name === "Slack",
    ) as SlackIntegration;
    const prometheusIntegration = integrations.find(
      (integration) => integration.vendor.name === "Prometheus",
    ) as PrometheusIntegration;
    if (!prometheusIntegration) {
      throw new AppError("Prometheus integration was not found", 500);
    } else if (!slackIntegration) {
      throw new AppError("Slack integration was not found", 500);
    }

    slackIntegration = (
      await secretManager.populateCredentials([slackIntegration])
    )[0] as SlackIntegration;

    const { access_token } = slackIntegration.credentials;
    const slackClient = new SlackClient(access_token);

    const { commonLabels, alerts } = event;
    const alertName = commonLabels.alertname;
    const { channel_id: channelId } =
      slackIntegration.metadata.incoming_webhook;
    const amMessage = await slackClient.waitAndFetchMessage(
      channelId,
      alertName,
    );

    await postInitialStatus(access_token, channelId, amMessage.ts!);

    const alert = alerts[0];
    const data: AlertEvent = {
      message: alertName,
      source: "Alert Manager",
      createdAt: alert.startsAt,
      data: alert as unknown as Record<string, unknown>,
    };
    const prompt = buildPrompt(data);

    const context: RunContext = {
      organizationName,
      organizationId,
      env: process.env.NODE_ENV as string,
      eventId: alertName,
      context: "trigger-alertmanager",
    };
    if (isLangfuseEnabled()) {
      const trace = generateTrace({ ...context });
      context.trace = trace;
    }

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
        entityId: String(organization._id),
        payload: {
          organizationId,
          organizationName,
          env: process.env.NODE_ENV as string,
          context: "trigger-alertmanager",
          traceId,
          observationId,
          traceURL,
        },
      };
      if (!isLangfuseEnabled()) {
        event.payload.text = answer;
        event.payload.prompt = prompt;
      }

      // Post a reply to the thread
      const metadata: MessageMetadata = {
        event_type: event.type,
        event_payload: event.payload,
      };
      const response = await slackClient.postReply({
        channelId,
        ts: amMessage?.ts as string,
        text: answer,
        metadata,
      });
      const { ok, ts } = response;
      if (ok) {
        await slackClient.addFeedbackReactions(channelId, ts!);
      }
      events.publish(event);
      return res.status(200).send("ok");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new AppError(error.message, 500, ErrorCode.AGENT_RUN_FAILED);
    }
  }),
);

export { router };
