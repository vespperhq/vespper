import express, { Request, Response } from "express";
import { integrationModel, indexModel, PlanFieldCode } from "@merlinn/db";
import { IIntegration } from "@merlinn/db";
import { runAgent } from "../agent";
import { getInteractionUser } from "../middlewares/slack";
import { langfuse } from "../clients/langfuse";
import { parseMessages } from "../agent/parse";
import { RunContext, TextBlock } from "../agent/types";
import { conversationTemplate } from "../agent/prompts";
import { chatModel, visionModel } from "../agent/model";
import { runModel } from "../agent/helper";
import { AppError, ErrorCode } from "../errors";
import { EventType, SystemEvent, events } from "../events";
import { catchAsync } from "../utils/errors";
import { validateModeration } from "../utils/moderation";
import { getPlanFieldState, incrementPlanFieldState } from "../services/plans";
import { checkJWT, getDBUser } from "../middlewares/auth";

const router = express.Router();

const getCompletions = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("No internal user", 403, ErrorCode.NO_INTERNAL_USER);
  } else if (req.user.status === "invited") {
    throw new AppError(
      "User hasn't accepted the invitation yet",
      403,
      ErrorCode.INVITATION_NOT_ACCEPTED,
    );
  }

  const queriesState = await getPlanFieldState({
    fieldCode: PlanFieldCode.queries,
    organizationId: String(req.user!.organization._id),
    userId: String(req.user!._id),
  });
  if (!queriesState.isAllowed) {
    throw new AppError(
      `You have exceeded your queries' quota`,
      429,
      ErrorCode.QUOTA_EXCEEDED,
    );
  }

  const index = await indexModel.getOne({
    organization: req.user!.organization._id,
  });
  if (!index) {
    throw new AppError("No index available", 404, ErrorCode.NO_INDEX);
  }

  const { messages, metadata: requestMetadata = {} } = req.body;
  const email = req.headers["x-slack-email"] as string;

  const organizationName = req.user.organization.name;
  const organizationId = String(req.user.organization._id);
  const integrations = (await integrationModel
    .get({
      organization: organizationId,
    })
    .populate("vendor")) as IIntegration[];
  if (!integrations.length) {
    throw new AppError("No integrations at all", 404, ErrorCode.NO_INTEGRATION);
  }

  let output: string | null = null;
  let traceId = "";
  let traceURL = "";
  let observationId = "";
  const chatMessages = parseMessages(messages);
  const message = chatMessages[chatMessages.length - 1];

  const moderationResult = await validateModeration(message.content as string);

  if (!moderationResult) {
    throw new AppError(
      "Text was found that violates our content policy",
      400,
      ErrorCode.MODERATION_FAILED,
    );
  }

  const hasImages =
    typeof message.content !== "string" &&
    message.content.some((item) => item.type === "image_url");

  const runContext: RunContext = {
    email,
    env: process.env.NODE_ENV as string,
    userId: String(req.user._id),
    organizationName: req.user.organization.name,
    organizationId: String(req.user.organization._id),
    context: "chat",
  };
  if (requestMetadata.eventId) {
    runContext.eventId = requestMetadata.eventId;
  }

  if (!hasImages) {
    // Remove the last item
    chatMessages.pop();

    const prompt =
      typeof message.content === "string"
        ? message.content
        : (message.content[0] as TextBlock).text;

    try {
      const { answer, answerContext } = await runAgent({
        prompt,
        model: chatModel,
        template: conversationTemplate,
        integrations,
        messages: chatMessages,
        context: runContext,
      });

      output = answer;
      traceId = answerContext.getTraceId()!;
      observationId = answerContext.getObservationId()!;
      traceURL = answerContext.getTraceURL()!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      throw new AppError(
        error.message,
        500,
        ErrorCode.AGENT_RUN_FAILED,
        error.stack,
      );
    }
  } else {
    try {
      const result = await runModel({
        model: visionModel,
        template: conversationTemplate,
        context: runContext,
        messages: chatMessages,
      });
      output = result.output;
      traceId = result.traceId!;
      observationId = result.observationId!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new AppError(error.message, 500, ErrorCode.MODEL_RUN_FAILED);
    }
  }

  const event: SystemEvent = {
    type: EventType.answer_created,
    payload: {
      env: process.env.NODE_ENV as string,
      context: "chat",
      traceId,
      traceURL,
      observationId,
      organizationId,
      organizationName,
    },
  };
  events.emit(EventType.answer_created, event);

  // Update quota
  await incrementPlanFieldState({
    fieldCode: PlanFieldCode.queries,
    organizationId: String(req.user!.organization._id),
    userId: String(req.user!._id),
  });

  return res.status(200).json({ output, traceURL, traceId, observationId });
};

/** This endpoint is called by our Slack application
 * It provides the app token as the authentication means, instead of Auth0 access token
 * TODO: figure out if we can generate a token from the slack app on the fly:
 * https://auth0.com/docs/secure/tokens/access-tokens/get-access-tokens
 */
router.post(
  "/completions/slack",
  getInteractionUser,
  catchAsync(async (req: Request, res: Response) => {
    return getCompletions(req, res);
  }),
);

router.post(
  "/completions/general",
  checkJWT,
  getDBUser,
  catchAsync(async (req: Request, res: Response) => {
    return getCompletions(req, res);
  }),
);

router.post(
  "/feedback",
  catchAsync(async (req: Request, res: Response) => {
    const { traceId, observationId, value } = req.body;
    if (!traceId || !observationId || !value) {
      throw new AppError(
        "Bad request. Need to supply traceId, observationId and value",
        400,
      );
    }
    try {
      await langfuse.score({
        name: "user-feedback",
        traceId,
        observationId,
        value,
      });
      return res.status(200).json({ message: "Feedback has been sent" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new AppError(error.message, 500, error.stack);
    }
  }),
);

export { router };
