import { userModel } from "@vespper/db";
import express, { Request, Response } from "express";
import { AppError } from "../../../errors";
import { catchAsync } from "../../../utils/errors";
import { EventType, SystemEvent, events } from "../../../events";

const router = express.Router();

router.post(
  "/after-signup",
  catchAsync(async (req: Request, res: Response) => {
    const actualKey = req.headers["authorization"];
    const expectedKey = process.env.ORY_WEBHOOK_SECRET as string;
    if (actualKey !== expectedKey) {
      throw AppError({ message: "Unauthorized", statusCode: 403 });
    }

    const {
      userId: oryId,
      traits: { email },
    } = req.body;
    if (!oryId || !email) {
      throw AppError({
        message: "Missing required fields: oryId, email",
        statusCode: 400,
      });
    }
    const user = await userModel.getOne({ oryId });
    if (!user) {
      const newUser = await userModel.create({
        oryId,
        email,
        status: "activated",
      });

      const event: SystemEvent = {
        type: EventType.user_registered,
        entityId: String(newUser._id),
        payload: {
          env: process.env.NODE_ENV as string,
          userId: String(newUser._id),
          email,
        },
      };
      events.publish(event);
      return res.status(200).json(user);
    } else if (user.status === "invited") {
      await userModel
        .getOneByIdAndUpdate(user._id, { status: "activated" })
        .populate("organization");

      if (!user) {
        throw AppError({ message: "User was not found", statusCode: 404 });
      }

      const event: SystemEvent = {
        type: EventType.user_registered,
        entityId: String(user._id),
        payload: {
          env: process.env.NODE_ENV as string,
          userId: String(user._id),
          email,
        },
      };
      events.publish(event);
      return res.status(200).json(user);
    }

    console.log("Nothing to do...");
    return res.status(200).json(user);
  }),
);

export { router };
