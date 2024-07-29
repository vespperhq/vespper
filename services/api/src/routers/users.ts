import express, { Request, Response } from "express";
import { checkAuth, getDBUser } from "../middlewares/auth";
import { userModel, PlanFieldCode } from "@merlinn/db";
import type { IUser } from "@merlinn/db";
import { FilterQuery } from "mongoose";
import { deleteOryIdentity, getOryIdentity } from "../clients/ory";
import { EventType, events } from "../events";
import type { SystemEvent } from "../events";
import { catchAsync } from "../utils/errors";
import { AppError } from "../errors";
import { decrementPlanFieldState } from "../services/plans";
import type { EnrichedUser } from "../types/internal";

// Helper function to get users and their Ory (our authentication service) info
const getEnrichedUsers = async (filters: FilterQuery<IUser>) => {
  const users = await userModel.get(filters);
  const oryUsers = await Promise.all(
    users.map((user) => getOryIdentity(user.oryId)),
  );
  const enrichedUsers = [] as EnrichedUser[];
  for (let i = 0; i < users.length; i++) {
    const { _id, status, role } = users[i];
    const { id: oryId, traits } = oryUsers[i];

    const email = traits.email;
    const name = traits.name
      ? `${traits.name.first} ${traits.name.last}`
      : email;

    // TODO: get the picture from the ory user
    const picture = "";
    enrichedUsers.push({
      oryId,
      _id,
      status,
      email,
      name,
      picture,
      role,
    });
  }
  return enrichedUsers;
};

const router = express.Router();
router.use(checkAuth);

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    // TODO: prevent users from viewing other org users
    const { oryId, organizationId } = req.query;
    const filters: FilterQuery<IUser> = {};
    if (oryId) {
      filters["oryId"] = oryId as string;
    }
    if (organizationId) {
      filters["organization"] = organizationId;
    }

    const users = await getEnrichedUsers(filters);
    return res.status(200).json({ users });
  }),
);

router.post(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { oryId, email } = req.body;
    if (!oryId || !email) {
      throw AppError({
        message: "Payload must contain the Ory ID",
        statusCode: 400,
      });
    }
    const existingUser = await userModel.getOne({ oryId });

    if (existingUser) {
      throw AppError({ message: "user already exists", statusCode: 400 });
    } else {
      const user = await userModel.create({
        oryId,
        email,
        status: "activated",
      });

      const event: SystemEvent = {
        type: EventType.user_registered,
        entityId: String(user._id),
        payload: {
          organizationId: String(user.organization._id),
          env: process.env.NODE_ENV as string,
          userId: String(user._id),
          email,
        },
      };
      events.publish(event);

      return res.status(200).json(user);
    }
  }),
);

router.get("/me", getDBUser, async (req: Request, res: Response) => {
  return res.status(200).json(req.user);
});

router.put(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    const { ...data } = req.body;
    const { id } = req.params;

    if (!id) {
      throw AppError({
        message: "Payload must contain an ID",
        statusCode: 400,
      });
    } else if (!Object.keys(data).length) {
      throw AppError({ message: "Payload must not be empty", statusCode: 400 });
    }

    const user = await userModel
      .getOneByIdAndUpdate(id, data)
      .populate("organization");

    if (!user) {
      throw AppError({ message: "User was not found", statusCode: 404 });
    }
    return res.status(200).json(user);
  }),
);

router.put(
  "/:id/accept-invite",
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw AppError({
        message: "Payload must contain an ID",
        statusCode: 400,
      });
    }

    const user = await userModel
      .getOneByIdAndUpdate(id, { status: "activated" })
      .populate("organization");

    if (!user) {
      throw AppError({ message: "User was not found", statusCode: 404 });
    }

    const event: SystemEvent = {
      type: EventType.invitation_accepted,
      entityId: id,
      payload: {
        organizationId: String(user.organization._id),
        env: process.env.NODE_ENV as string,
        userId: id,
        email: user.email,
      },
    };
    events.publish(event);
    return res.status(200).json(user);
  }),
);

router.delete(
  "/:id",
  getDBUser,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await userModel.getOneById(id);
    if (!user) {
      throw AppError({ message: "User was not found", statusCode: 404 });
    } else if (!req.user!.organization._id.equals(user.organization._id)) {
      throw AppError({
        message: "Users not in the same organization",
        statusCode: 403,
      });
    } else if (req.user!.role !== "owner") {
      throw AppError({
        message: "Only owners can delete other users",
        statusCode: 403,
      });
    }

    await userModel.deleteOneById(id);
    await deleteOryIdentity(user.oryId);

    // Decrease the seats count in the plan state
    await decrementPlanFieldState({
      organizationId: String(user.organization._id),
      fieldCode: PlanFieldCode.seats,
    });

    return res.status(200).json({ deleted: true });
  }),
);

export { router };
