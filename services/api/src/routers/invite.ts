import express, { Request, Response } from "express";
import { checkJWT, getDBUser } from "../middlewares/auth";
import { createAuth0User, createResetTicket } from "../clients/auth0";
import { SendGridClient, OpsgenieClient, PagerDutyClient } from "../clients";
import { userModel } from "../db/models/user";
import { integrationModel } from "../db/models/integration";
import {
  IIntegration,
  IOrganization,
  OpsgenieIntegration,
  PagerDutyIntegration,
  PlanFieldCode,
} from "../types";
import { EventType, SystemEvent, events } from "../events";
import { catchAsync } from "../utils/errors";
import { AppError } from "../errors";
import { populateCredentials } from "../clients/secretManager";
import { refreshPagerDutyToken } from "../services/oauth";
import { getPlanFieldState, incrementPlanFieldState } from "../services/plans";

const router = express.Router();
router.use(checkJWT);
router.use(getDBUser);

router.get(
  "/import",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw new AppError("Only owners can invite members", 403);
    }

    const { source } = req.query;
    const allowedSources = ["PagerDuty", "Opsgenie"];

    if (!allowedSources.includes(source as string)) {
      throw new AppError(
        `Source is invalid. Allowed sources: ${allowedSources.join(", ")}`,
        400,
      );
    }

    let integration = (await integrationModel.getIntegrationByName(
      source as string,
      {
        organization: req.user!.organization._id,
      },
    )) as IIntegration;
    if (!integration) {
      throw new AppError(
        `Your organization do not have an integration with ${source}`,
        404,
      );
    }

    switch (source) {
      case "Opsgenie": {
        integration = (
          await populateCredentials([integration])
        )[0] as IIntegration;
        const { region } = (integration as OpsgenieIntegration).metadata;
        const { apiKey } = (integration as OpsgenieIntegration).credentials;
        const opsgenieClient = new OpsgenieClient(apiKey, region);

        const usersData = await opsgenieClient.getUsers();
        if (!usersData) {
          throw new AppError(`Could not fetch users from ${source}`, 500);
        }
        return res.status(200).json({ users: usersData.data });
      }
      case "PagerDuty": {
        // TODO: need to extract refresh tokens to a centralized place.
        await refreshPagerDutyToken(integration._id.toString());
        integration = (
          await populateCredentials([integration])
        )[0] as IIntegration;
        const { access_token } = (integration as PagerDutyIntegration)
          .credentials;
        const pagerdutyClient = new PagerDutyClient(access_token);
        const users = await pagerdutyClient.getUsers();
        if (!users) {
          throw new AppError(`Could not fetch users from ${source}`, 500);
        }
        return res.status(200).json({ users });
      }
    }
  }),
);

router.post(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw new AppError("Only owners can invite members", 403);
    }

    const { emails } = req.body;
    const seatsState = await getPlanFieldState({
      fieldCode: PlanFieldCode.seats,
      organizationId: String(req.user!.organization._id),
    });

    if (seatsState.value + emails.length > seatsState.limit) {
      throw new AppError("You have exceeded your plan's seats", 400);
    }

    const sendInvitation = async (
      email: string,
      organization: IOrganization,
    ) => {
      const auth0User = await createAuth0User(email);
      const { ticket } = await createResetTicket(auth0User.user_id);

      // Create an internal user
      const internalUser = await userModel.create({
        auth0Id: auth0User.user_id,
        status: "invited",
        role: "member",
        organization,
        email,
      });

      // Send Email
      const subject = "Invitation to Merlinn";
      const html = `You have been invited to Merlinn. 
    Please click the following link to join: <a href=${ticket}>Click here</a>.
    Once you are registered, you can sign in to https://app.merlinn.co or start using the Slack bot!`;

      const client = new SendGridClient(process.env.SENDGRID_API_KEY as string);
      await client.sendEmail({ recipient: email, subject, html });

      const event: SystemEvent = {
        type: EventType.invitation_sent,
        payload: {
          env: process.env.NODE_ENV as string,
          userId: String(internalUser._id),
          inviterId: String(req.user!._id),
          email,
        },
      };
      events.emit(EventType.invitation_sent, event);
    };

    await Promise.all(
      emails.map((email: string) =>
        sendInvitation(email, req.user!.organization),
      ),
    );

    await incrementPlanFieldState({
      fieldCode: PlanFieldCode.seats,
      organizationId: String(req.user!.organization._id),
      value: emails.length,
    });

    return res.status(200).json({ sent: true });
  }),
);

export { router };
