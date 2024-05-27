import { userModel } from "@merlinn/db";
import express, { Request, Response } from "express";
import { AppError } from "../../../errors";
import { EventType, SystemEvent, events } from "../../../events";

const router = express.Router();

router.post("/validate-user", async (req: Request, res: Response) => {
  const actualServiceKey = req.headers["x-auth0-service-key"];
  const expectedServiceKey = process.env.AUTH0_SERVICE_KEY as string;
  if (actualServiceKey !== expectedServiceKey) {
    throw new AppError("Unauthorized", 403);
  }

  const { auth0Id, email } = req.body;

  const user = await userModel.getOne({ auth0Id });
  if (!user) {
    const newUser = await userModel.create({
      auth0Id,
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
