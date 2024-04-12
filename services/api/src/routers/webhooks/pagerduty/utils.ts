import { Request, Response, NextFunction } from "express";
import { pdVerifier } from "../../../common/verifier";
import { catchAsync } from "../../../utils/errors";
import { AppError } from "../../../errors";

export const checkPagerDutySignature = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const signatures = req.headers["x-pagerduty-signature"] as string;

    if (!signatures) {
      throw new AppError(
        "Unauthorized webhook request. Signatures are not present in the request",
        403,
      );
    }

    const isValid = pdVerifier.verify(JSON.stringify(req.body), signatures);
    if (!isValid) {
      throw new AppError(
        "Unauthorized webhook request. Signatures are invalid",
        403,
      );
    }

    return next();
  },
);
