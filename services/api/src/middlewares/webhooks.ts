import { Request, Response, NextFunction } from "express";
import { webhookModel, PlanFieldCode, IWebhook } from "@merlinn/db";
import { catchAsync } from "../utils/errors";
import { AppError } from "../errors";
import { getPlanFieldState } from "../services/plans";

export const checkWebhookSecret = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const claimedSecret = req.headers["x-merlinn-secret"];
    if (!claimedSecret) {
      throw new AppError("Request does not contain a secret header", 400);
    }

    const webhook = await webhookModel
      .getOneByEncryptedField({
        secret: claimedSecret,
      })
      .populate("organization");

    if (!webhook) {
      throw new AppError("Secret is invalid", 400);
    }
    req.webhook = webhook as IWebhook;

    return next();
  },
);

export const checkAlertsQuota = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { organization } = req.webhook!;
    const alertsState = await getPlanFieldState({
      fieldCode: PlanFieldCode.alerts,
      organizationId: organization._id.toString(),
    });
    if (!alertsState.isAllowed) {
      return res.status(205).json({ message: "Quota exceeded" });
    }
    return next();
  },
);
