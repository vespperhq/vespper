import express, { Request, Response } from "express";
import {
  checkAlertsQuota,
  checkWebhookSecret,
} from "../../../middlewares/webhooks";
import { catchAsync } from "../../../utils/errors";
import { processWebhook } from "./processor";

const router = express.Router();

router.post(
  "/",
  checkWebhookSecret,
  checkAlertsQuota,
  catchAsync(async (req: Request, res: Response) => {
    // Acknowledge the webhook as soon as possible
    res.status(202).send("ok");

    try {
      await processWebhook(req.webhook!, req.body);
    } catch (error) {
      console.log("Could not process webhook event");
      console.error(error);
    }
  }),
);

export { router };
