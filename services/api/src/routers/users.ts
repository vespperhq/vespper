import express, { Request, Response } from "express";
import { checkJWT, getDBUser } from "../middlewares/auth";
import { getEnrichedUsers, userModel } from "../db/models/user";
import { IUser, PlanFieldCode } from "../types";
import { FilterQuery } from "mongoose";
import { deleteAuth0User } from "../clients/auth0";
import { EventType, SystemEvent, events } from "../events";
import { catchAsync } from "../utils/errors";
import { AppError } from "../errors";
import { decrementPlanFieldState } from "../services/plans";

const router = express.Router();
router.use(checkJWT);

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    // TODO: prevent users from viewing other org users!
    // This endpoint serves Auth0 custom action. Need to find a way
    // to add a role to their request.
    const { auth0Id, organizationId } = req.query;
    const filters: FilterQuery<IUser> = {};
    if (auth0Id) {
      filters["auth0Id"] = auth0Id as string;
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
    const { auth0Id, email } = req.body;
    if (!auth0Id || !email) {
      throw new AppError("Payload must contain the Auth0 ID", 400);
    }
    const existingUser = await userModel.getOne({ auth0Id });

    if (existingUser) {
      throw new AppError("user already exists", 400);
    } else {
      const user = await userModel.create({
        auth0Id,
        email,
        status: "activated",
      });

      const event: SystemEvent = {
        type: EventType.user_registered,
        payload: {
          env: process.env.NODE_ENV as string,
          userId: String(user._id),
          email,
        },
      };
      events.emit(event.type, event);

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
      throw new AppError("Payload must contain an ID", 400);
    } else if (!Object.keys(data).length) {
      throw new AppError("Payload must not be empty", 400);
    }

    const user = await userModel
      .getOneByIdAndUpdate(id, data)
      .populate("organization");

    if (!user) {
      throw new AppError("User was not found", 404);
    }
    return res.status(200).json(user);
  }),
);

router.put(
  "/:id/accept-invite",
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Payload must contain an ID", 400);
    }

    const user = await userModel
      .getOneByIdAndUpdate(id, { status: "activated" })
      .populate("organization");

    if (!user) {
      throw new AppError("User was not found", 404);
    }

    const event: SystemEvent = {
      type: EventType.invitation_accepted,
      payload: {
        env: process.env.NODE_ENV as string,
        userId: id,
        email: user.email,
      },
    };
    events.emit(EventType.invitation_accepted, event);
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
      throw new AppError("User was not found", 404);
    } else if (!req.user!.organization._id.equals(user.organization._id)) {
      throw new AppError("Users not in the same organization", 403);
    } else if (req.user!.role !== "owner") {
      throw new AppError("Only owners can delete other users", 403);
    }

    await userModel.deleteOneById(id);
    await deleteAuth0User(user.auth0Id);

    // Decrease the seats count in the plan state
    await decrementPlanFieldState({
      organizationId: String(user.organization._id),
      fieldCode: PlanFieldCode.seats,
    });

    return res.status(200).json({ deleted: true });
  }),
);

export { router };
