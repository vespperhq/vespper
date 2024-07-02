import * as crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import { GithubIntegration, integrationModel } from "@merlinn/db";
import { runAgent } from "../../../agent";
import { SystemEvent, EventType, events } from "../../../events";
import { conversationIssuesTemplate } from "../../../agent/prompts";
import { chatModel } from "../../../agent/model";
import { catchAsync } from "../../../utils/errors";
import { AppError } from "../../../errors";
import { BaseMessage, RunContext, TextBlock } from "../../../agent/types";
import { secretManager } from "../../../common/secrets";
// import { validateModeration } from "../../../utils/moderation";
import { parseMessages } from "../../../agent/parse";
import { GithubClient } from "../../../clients";
import { generateTrace } from "../../../agent/helper";
import { isLangfuseEnabled } from "../../../utils/ee";

const router = express.Router();

const verifySignature = catchAsync(
  (req: Request, res: Response, next: NextFunction) => {
    const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET as string;
    const signature = crypto
      .createHmac("sha256", GITHUB_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (!req.headers["x-hub-signature-256"]) {
      throw new AppError("Missing signature", 400);
    }
    const trusted = Buffer.from(`sha256=${signature}`, "ascii");
    const untrusted = Buffer.from(
      req.headers["x-hub-signature-256"] as string,
      "ascii",
    );
    const isVerified = crypto.timingSafeEqual(trusted, untrusted);
    if (!isVerified) {
      res.status(401).send("Unauthorized");
      return;
    }
    return next();
  },
);

router.post(
  "/",
  verifySignature,
  // checkAlertsQuota,
  catchAsync(async (req: Request, res: Response) => {
    const githubOrgId = req.body.organization.id;
    if (!githubOrgId) {
      throw new AppError("Missing installation ID", 400);
    }
    const { action, issue, sender, repository, comment } = req.body;
    if (sender.type === "Bot") {
      return res.status(200).send("Bot message. Ignoring.");
    } else if (!["opened", "created"].includes(action)) {
      return res.status(200).send(`Unsupported event: ${action}. Ignoring`);
    }

    let githubIntegration = (await integrationModel
      .getOne({
        "metadata.githubOrgId": githubOrgId,
      })
      .populate("organization")) as GithubIntegration;

    if (!githubIntegration) {
      throw new AppError("No github integration", 404);
    }

    githubIntegration = (
      await secretManager.populateCredentials([githubIntegration])
    )[0] as GithubIntegration;

    const installationId = githubIntegration.metadata["installationId"];
    const client = await GithubClient.fromInstallation(
      process.env.GH_APP_ID as string,
      process.env.GH_APP_PRIVATE_KEY as string,
      installationId,
    );

    const { organization } = githubIntegration;
    const organizationName = organization.name;
    const organizationId = String(organization._id);

    const [owner, repo] = repository.full_name.split("/");

    const history: BaseMessage[] = [];
    let message: BaseMessage;
    if (action === "opened") {
      message = {
        role: "user",
        content: issue.body,
      };
    } else {
      const comments = await client.getIssueComments({
        owner,
        repo,
        issue_number: issue.number,
      });
      history.push(
        ...[
          {
            role: "user",
            content: issue.body,
          },
          // We're ignoring from the last element since it is the new message, and we have it in the comment variable
          ...comments.slice(0, -1).map((comment) => ({
            role: comment.user?.name === "Merlinn" ? "assistant" : "user",
            content: comment.body!,
          })),
        ],
      );
      message = {
        role: "user",
        content: comment.body,
      };
    }

    // Prepare history and last message
    const chatMessages = parseMessages(history);

    // const moderationResult = await validateModeration(
    //   message.content as string,
    // );

    // if (!moderationResult) {
    //   throw new AppError(
    //     "Text was found that violates our content policy",
    //     400,
    //     ErrorCode.MODERATION_FAILED,
    //   );
    // }

    // const hasImages =
    //   typeof message.content !== "string" &&
    //   message.content.some((item) => item.type === "image_url");

    const runContext: RunContext = {
      email: sender.login,
      env: process.env.NODE_ENV as string,
      // userId: String(req.user._id),
      // TODO: extract user id from the github event maybe
      userId: "",
      organizationName: organization.name,
      organizationId: String(organization._id),
      context: "chat-github",
    };

    if (isLangfuseEnabled()) {
      const trace = generateTrace({ ...runContext });
      runContext.trace = trace;
    }

    const prompt =
      typeof message.content === "string"
        ? message.content
        : (message.content[0] as TextBlock).text;

    const { answer, answerContext } = await runAgent({
      prompt,
      model: chatModel,
      template: conversationIssuesTemplate,
      integrations: [],
      messages: chatMessages,
      context: runContext,
    });

    const output = answer;
    const traceId = answerContext.getTraceId()!;
    const observationId = answerContext.getObservationId()!;
    const traceURL = answerContext.getTraceURL()!;

    const event: SystemEvent = {
      type: EventType.answer_created,
      entityId: String(organization._id),
      payload: {
        organizationId,
        organizationName,
        env: process.env.NODE_ENV as string,
        context: "chat",
        traceId,
        traceURL,
        observationId,
      },
    };
    if (!isLangfuseEnabled()) {
      event.payload.text = answer;
      event.payload.prompt = prompt;
    }
    events.publish(event);

    // Create a {new comment on the issue
    if (output) {
      await client.createNewIssueComment({
        owner,
        repo,
        issue_number: issue.number,
        body: output,
      });
    }

    return res.status(200).send("ok");
  }),
);

export { router };
