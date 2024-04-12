import { Request, Response, NextFunction } from "express";
import { integrationModel } from "../db/models/integration";
import { userModel } from "../db/models/user";
import { IUser } from "../types";
import { AppError, ErrorCode } from "../errors";
import { catchAsync } from "../utils/errors";

export const getInteractionUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const claimedToken = req.headers["x-slack-app-token"];
    const actualToken = process.env.SLACK_APP_TOKEN as string;
    if (claimedToken !== actualToken) {
      throw new AppError("Token is invalid", 401);
    }
    const email = req.headers["x-slack-email"];
    const team = req.headers["x-slack-team"];

    // If not Slack integration, we exit
    const slackIntegration = await integrationModel.getOne({
      "metadata.team.id": team,
    });
    if (!slackIntegration) {
      throw new AppError("No slack integration", 401, ErrorCode.NO_INTEGRATION);
    }

    const { organization } = slackIntegration;
    const user = await userModel
      .getOne({
        organization,
        email,
      })
      .populate("organization");
    req.user = user as IUser;

    next();
  },
);
