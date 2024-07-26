import express, { Request, Response } from "express";
import {
  checkAlertsQuota,
  checkWebhookSecret,
} from "../../../middlewares/webhooks";
import { checkPagerDutySignature } from "./utils";
import { processWebhook } from "./processor";

const router = express.Router();

// This is just an in-memory store for webhook IDs
// TODO: need to use redis or something similar
const webhookIds: string[] = [];

router.post(
  "/",
  checkPagerDutySignature,
  checkWebhookSecret,
  checkAlertsQuota,
  async (req: Request, res: Response) => {
    // Acknowledge the webhook as soon as possible
    res.status(202).send("ok");

    // PagerDuty sends a webhook ID with every event that can be used to deduplicate events
    // https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTkx-behavior#at-least-once-delivery
    const webhookId = req.headers["x-webhook-id"] as string;
    if (webhookIds.includes(webhookId)) {
      console.log("Webhook already processed");
      return;
    }

    try {
      await processWebhook(req.webhook!, req.body);
    } catch (error) {
      console.log("Could not process webhook event");
      console.error(error);
    }
  },
);

export { router };
