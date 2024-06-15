import { Request, Response, NextFunction } from "express";
import { userModel, IUser } from "@merlinn/db";
import { AppError, ErrorCode } from "../errors";
import { catchAsync } from "../utils/errors";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sdk = require("@ory/client"); // For some reason, import crashes here. using require for now

const ory = new sdk.FrontendApi(
  new sdk.Configuration({
    basePath: process.env.ORY_URL,
  }),
);

export const checkAuth = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { data: session } = await ory.toSession({
      cookie: req.header("cookie"),
    });

    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};

export const getDBUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: oryId } = req.session!.identity!;
    // Get the user that performs the request and get their organization
    const user = await userModel.getOne({ oryId }).populate({
      path: "organization",
      populate: {
        path: "plan",
      },
    });
    if (!user) {
      throw new AppError("No internal user", 401, ErrorCode.NO_INTERNAL_USER);
    }
    req.user = user as IUser;
    next();
  },
);
