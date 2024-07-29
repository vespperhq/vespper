import express, { Request, Response } from "express";
import { checkAuth, getDBUser } from "../middlewares/auth";
import { createOryIdentity, createRecoveryLink } from "../clients/ory";
import { EmailClient, OpsgenieClient, PagerDutyClient } from "../clients";
import { userModel, integrationModel, PlanFieldCode } from "@merlinn/db";
import type {
  IIntegration,
  IOrganization,
  OpsgenieIntegration,
  PagerDutyIntegration,
} from "@merlinn/db";
import { EventType, SystemEvent, events } from "../events";
import { catchAsync } from "../utils/errors";
import { isEnterprise } from "../utils/ee";
import { AppError } from "../errors";
import { refreshPagerDutyToken } from "../services/oauth";
import { getPlanFieldState, incrementPlanFieldState } from "../services/plans";
import { secretManager } from "../common/secrets";

const router = express.Router();
router.use(checkAuth);
router.use(getDBUser);

router.get(
  "/import",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw AppError({
        message: "Only owners can invite members",
        statusCode: 403,
      });
    }

    const { source } = req.query;
    const allowedSources = ["PagerDuty", "Opsgenie"];

    if (!allowedSources.includes(source as string)) {
      throw AppError({
        message: `Source is invalid. Allowed sources: ${allowedSources.join(", ")}`,
        statusCode: 400,
      });
    }

    let integration = (await integrationModel.getIntegrationByName(
      source as string,
      {
        organization: req.user!.organization._id,
      },
    )) as IIntegration;
    if (!integration) {
      throw AppError({
        message: `Your organization do not have an integration with ${source}`,
        statusCode: 404,
      });
    }

    switch (source) {
      case "Opsgenie": {
        integration = (
          await secretManager.populateCredentials([integration])
        )[0] as IIntegration;
        const { region } = (integration as OpsgenieIntegration).metadata;
        const { apiKey } = (integration as OpsgenieIntegration).credentials;
        const opsgenieClient = new OpsgenieClient(apiKey, region);

        const usersData = await opsgenieClient.getUsers();
        if (!usersData) {
          throw AppError({
            message: `Could not fetch users from ${source}`,
            statusCode: 500,
          });
        }
        return res.status(200).json({ users: usersData.data });
      }
      case "PagerDuty": {
        // TODO: need to extract refresh tokens to a centralized place.
        await refreshPagerDutyToken(integration._id.toString());
        integration = (
          await secretManager.populateCredentials([integration])
        )[0] as IIntegration;
        const { access_token } = (integration as PagerDutyIntegration)
          .credentials;
        const pagerdutyClient = new PagerDutyClient(access_token);
        const users = await pagerdutyClient.getUsers();
        if (!users) {
          throw AppError({
            message: `Could not fetch users from ${source}`,
            statusCode: 500,
          });
        }
        return res.status(200).json({ users });
      }
      default: {
        throw AppError({
          message: `Source ${source} is not supported`,
          statusCode: 400,
        });
      }
    }
  }),
);

router.post(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw AppError({
        message: "Only owners can invite members",
        statusCode: 403,
      });
    }

    const emails = req.body.emails as string[];
    if (isEnterprise()) {
      const seatsState = await getPlanFieldState({
        fieldCode: PlanFieldCode.seats,
        organizationId: String(req.user!.organization._id),
      });

      if (seatsState.value + emails.length > seatsState.limit) {
        throw AppError({
          message: "You have exceeded your plan's seats",
          statusCode: 400,
        });
      }
      await incrementPlanFieldState({
        fieldCode: PlanFieldCode.seats,
        organizationId: String(req.user!.organization._id),
        value: emails.length,
      });
    }

    const sendInvitation = async (
      email: string,
      organization: IOrganization,
    ): Promise<{ email: string; recovery_link: string }> => {
      const oryIdentity = await createOryIdentity(email);
      const { recovery_link } = await createRecoveryLink(oryIdentity.id);
      // Create an internal user
      const internalUser = await userModel.create({
        oryId: oryIdentity.id,
        status: "invited",
        role: "member",
        organization,
        email,
      });

      // Send Email
      const smtpConnectionUrl = process.env.SMTP_CONNECTION_URL as string;
      if (smtpConnectionUrl) {
        const subject = "Invitation to Merlinn";
        const html = `You have been invited to Merlinn.
    Please click the following link to join: <a href=${recovery_link}>Click here</a>.
    Once you are registered, you can sign in to https://app.merlinn.co or start using the Slack bot!`;
        const client = new EmailClient(smtpConnectionUrl);
        await client.sendEmail({ to: email, subject, html });
      }

      const event: SystemEvent = {
        type: EventType.invitation_sent,
        entityId: String(internalUser._id),
        payload: {
          organizationId: String(organization._id),
          env: process.env.NODE_ENV as string,
          userId: String(internalUser._id),
          inviterId: String(req.user!._id),
          email,
        },
      };
      events.publish(event);

      return { email, recovery_link };
    };

    const invitations = await Promise.all(
      emails.map((email: string) =>
        sendInvitation(email, req.user!.organization),
      ),
    );

    return res.status(200).json({ sent: true, invitations });
  }),
);

export { router };
