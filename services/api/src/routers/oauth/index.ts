import express from "express";
import { router as slackRouter } from "./slack";
import { router as pagerdutyRouter } from "./pagerduty";
import { router as githubRouter } from "./github";
import { router as notionRouter } from "./notion";
import { router as atlassianRouter } from "./atlassian";

const router = express.Router();

router.use("/pagerduty", pagerdutyRouter);
router.use("/slack", slackRouter);
router.use("/github", githubRouter);
router.use("/notion", notionRouter);
router.use("/atlassian", atlassianRouter);

export { router };
