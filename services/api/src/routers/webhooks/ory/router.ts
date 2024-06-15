import { userModel } from "@merlinn/db";
import express, { Request, Response } from "express";
import { AppError } from "../../../errors";
import { EventType, SystemEvent, events } from "../../../events";

const router = express.Router();

router.post("/after-signup", async (req: Request, res: Response) => {
  const actualKey = req.headers["authorization"];
  const expectedKey = process.env.ORY_WEBHOOK_SECRET as string;
  if (actualKey !== expectedKey) {
    throw new AppError("Unauthorized", 403);
  }

  const {
    userId: oryId,
    traits: { email },
  } = req.body;
  if (!oryId || !email) {
    throw new AppError("Missing required fields: oryId, email", 400);
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
      payload: {
        env: process.env.NODE_ENV as string,
        userId: String(newUser._id),
        email,
      },
    };
    events.emit(event.type, event);
    return res.status(200).json(user);
  } else if (user.status === "invited") {
    await userModel
      .getOneByIdAndUpdate(user._id, { status: "activated" })
      .populate("organization");

    if (!user) {
      throw new AppError("User was not found", 404);
    }

    const event: SystemEvent = {
      type: EventType.invitation_accepted,
      payload: {
        env: process.env.NODE_ENV as string,
        userId: String(user._id),
        email: user.email,
      },
    };
    events.emit(EventType.invitation_accepted, event);
    return res.status(200).json(user);
  }

  console.log("Nothing to do...");
  return res.status(200).json(user);
});

export { router };
