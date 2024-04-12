import { Request, Response, NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { userModel } from "../db/models/user";
import { AppError, ErrorCode } from "../errors";
import { IUser } from "../types";
import { catchAsync } from "../utils/errors";

export const checkJWT = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_ISSUER_BASE_URL}`,
});

export const getDBUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sub: auth0Id } = req.auth!.payload;
    // Get the user that performs the request and get their organization
    const user = await userModel.getOne({ auth0Id }).populate({
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
