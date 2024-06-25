import { Request, Response, NextFunction } from "express";
import { webhookModel, PlanFieldCode, IWebhook } from "@merlinn/db";
import { catchAsync } from "../utils/errors";
import { isEnterprise } from "../utils/ee";
import { AppError } from "../errors";
import { getPlanFieldState } from "../services/plans";

export function getSecretFromRequest(req: Request) {
  const customHeaderSecret = req.headers["x-merlinn-secret"] as string;

  if (customHeaderSecret) {
    return customHeaderSecret;
  } else {
    const authHeader = req.headers["authorization"] as string;
    if (!authHeader) {
      throw new AppError(
        "Request does not contain a secret header (either custom or auth header)",
        400,
      );
    }

    // Check it's a valid Bearer token
    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError("Request does not contain a valid Bearer token", 400);
    }

    const [, authHeaderSecret] = authHeader.split(" ");
    return authHeaderSecret;
  }
}

export const checkWebhookSecret = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const claimedSecret = getSecretFromRequest(req);

    console.log("claimedSecret", claimedSecret);
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
    // We only enforce this in the cloud
    if (!isEnterprise()) {
      return next();
    }

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
