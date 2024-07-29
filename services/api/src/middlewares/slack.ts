import { Request, Response, NextFunction } from "express";
import { IUser, userModel, integrationModel } from "@merlinn/db";
import { AppError, ErrorCode } from "../errors";
import { catchAsync } from "../utils/errors";

export const getSlackUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const claimedToken = req.headers["x-slack-app-token"];
    const actualToken = process.env.SLACK_APP_TOKEN as string;
    if (claimedToken !== actualToken) {
      throw AppError({ message: "Token is invalid", statusCode: 401 });
    }
    const email = req.headers["x-slack-email"];
    const team = req.headers["x-slack-team"];

    // If not Slack integration, we exit
    const slackIntegration = await integrationModel.getOne({
      "metadata.team.id": team,
    });
    if (!slackIntegration) {
      throw AppError({
        message: "No slack integration",
        statusCode: 401,
        internalCode: ErrorCode.NO_INTEGRATION,
      });
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
