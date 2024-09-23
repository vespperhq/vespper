import express, { Request, Response } from "express";
import {
  PlanFieldCode,
  organizationModel,
  userModel,
  planModel,
  integrationModel,
  webhookModel,
  indexModel,
  planStateModel,
} from "@vespper/db";
import { checkAuth, getDBUser } from "../middlewares/auth";
import { catchAsync } from "../utils/errors";
import { isEnterprise } from "../utils/ee";
import { AppError } from "../errors";
import { getPlanFieldState } from "../services/plans";
import { EventType, events } from "../events";

const router = express.Router();

router.use(checkAuth);
router.use(getDBUser);

router.post(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const { name } = req.body;

    if (req.user!.organization) {
      throw AppError({
        message: "You already belong to an organization",
        statusCode: 400,
      });
    }

    const plan = await planModel.getOne({ name: "free" });
    const organization = await organizationModel.create({
      name,
      plan: plan!._id,
    });
    await planStateModel.createInitialState(plan!._id, organization._id);

    await userModel.getOneAndUpdate(
      { _id: req.user!._id },
      {
        organization: organization,
        role: "owner",
      },
    );

    events.publish({
      type: EventType.organization_created,
      entityId: organization._id.toString(),
      payload: {
        organizationId: organization._id.toString(),
        organizationName: organization.name,
        userId: req.user!._id.toString(),
        email: req.user!.email,
      },
    });

    return res.status(200).json(organization);
  }),
);

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const organization = req.user!.organization;

    return res.status(200).json(organization);
  }),
);

router.put(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw AppError({
        message: "Only owners can update organization data",
        statusCode: 403,
      });
    }

    const { id } = req.params;
    const { organization } = req.body;
    const updated = await organizationModel.getOneByIdAndUpdate(
      id,
      organization,
    );

    return res.status(200).json(updated);
  }),
);

router.delete(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw AppError({
        message: "Only owners can delete organizations",
        statusCode: 403,
      });
    }
    const { id } = req.params;

    // First, delete all related data to that organization
    await Promise.all([
      integrationModel.delete({ organization: id }),
      webhookModel.delete({ organization: id }),
      indexModel.delete({ organization: id }),
      planStateModel.delete({ organization: id }),
    ]);

    // Make all users orphans
    const users = await userModel.get({ organization: id });
    for (const user of users) {
      await userModel.getOneAndUpdate(
        { _id: user._id },
        { organization: undefined },
      );
    }

    // Finally, delete the organization
    const updated = await organizationModel.deleteOneById(id);

    events.publish({
      type: EventType.organization_deleted,
      entityId: id,
      payload: {
        userId: req.user!._id.toString(),
        email: req.user!.email,
        organizationId: id,
        organizationName: req.user!.organization.name,
      },
    });

    return res.status(200).json(updated);
  }),
);

// If the organization is an enterprise, we attach a usage route so
// they'll know how much they've used of their plan.
if (isEnterprise()) {
  router.get(
    "/:id/usage",
    catchAsync(async (req: Request, res: Response) => {
      const seatsState = await getPlanFieldState({
        organizationId: String(req.user!.organization._id),
        fieldCode: PlanFieldCode.seats,
      });
      const attemptsState = await getPlanFieldState({
        organizationId: String(req.user!.organization._id),
        fieldCode: PlanFieldCode.indexingAttempts,
      });
      const documentsState = await getPlanFieldState({
        organizationId: String(req.user!.organization._id),
        fieldCode: PlanFieldCode.indexingDocuments,
      });
      const alertsState = await getPlanFieldState({
        organizationId: String(req.user!.organization._id),
        fieldCode: PlanFieldCode.alerts,
      });
      const queriesState = await getPlanFieldState({
        organizationId: String(req.user!.organization._id),
        userId: String(req.user!._id),
        fieldCode: PlanFieldCode.queries,
      });

      // Total usage object
      const usage = {
        seats: { current: seatsState.value, total: seatsState.limit },
        indexingAttempts: {
          current: attemptsState.value,
          total: attemptsState.limit,
        },
        indexingDocuments: {
          current: documentsState.value,
          total: documentsState.limit,
        },
        alerts: { current: alertsState.value, total: alertsState.limit },
        queries: { current: queriesState.value, total: queriesState.limit },
      };

      return res.status(200).json({ usage });
    }),
  );
}
export { router };
