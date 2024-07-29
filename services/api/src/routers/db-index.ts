import express, { Request, Response } from "express";
import axios from "axios";
import { checkAuth, getDBUser } from "../middlewares/auth";
import { catchAsync } from "../utils/errors";
import { AppError, ErrorCode } from "../errors";
import { indexModel, integrationModel, PlanFieldCode } from "@merlinn/db";
import { refreshAtlassianToken } from "../services/oauth";
import type { AtlassianIntegration, IIntegration } from "@merlinn/db";
import { zip } from "../utils/arrays";
import { isEnterprise } from "../utils/ee";
import { getTimestamp } from "../utils/dates";
import { getPlanFieldState } from "../services/plans";
import { getVectorStore } from "../agent/rag";

const ATLASSIAN_DATA_SOURCES = ["Confluence", "Jira"];

const router = express.Router();
router.use(checkAuth);
router.use(getDBUser);
// TODO: remove once we finish with beta testing ang do public!

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw AppError({
        message: "Only owners can access indexes",
        statusCode: 403,
      });
    }

    const index = await indexModel.getOne({
      organization: req.user!.organization._id,
    });

    return res.status(200).json(index);
  }),
);

router.post(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw AppError({
        message: "Only owners are allowed to create indexes",
        statusCode: 403,
      });
    }

    if (isEnterprise()) {
      const attemptsState = await getPlanFieldState({
        fieldCode: PlanFieldCode.indexingAttempts,
        organizationId: String(req.user!.organization._id),
      });
      if (!attemptsState.isAllowed) {
        throw AppError({
          message: `You have exceeded your indexing attempts' quota`,
          statusCode: 429,
          internalCode: ErrorCode.QUOTA_EXCEEDED,
        });
      }
    }

    // TODO: use a proper messaging solution instead of plain API request
    const { dataSources } = req.body;
    if (!dataSources) {
      throw AppError({ message: "No data sources provided", statusCode: 400 });
    }

    const integrations = await Promise.all(
      dataSources.map(async (source: string) => {
        const integration = await integrationModel.getIntegrationByName(
          source,
          {
            organization: req.user!.organization._id,
          },
        );
        if (!integration) {
          throw AppError({
            message: `No such integration "${source}"`,
            statusCode: 404,
          });
        }
        return integration;
      }),
    );

    // TODO: right now we hard-code the OAuth refresh token mechanism in several places in the code,
    // and we make it specific to PagerDuty and Atlassian. We should make it more generic.
    await Promise.all(
      zip(dataSources, integrations)
        .filter(
          ([source, integration]) =>
            ATLASSIAN_DATA_SOURCES.includes(source as string) &&
            (integration as AtlassianIntegration).type == "oauth",
        )
        .map(async ([, integration]) => {
          const { expires_in } = (integration as AtlassianIntegration).metadata;
          const issueDate = (integration as AtlassianIntegration).updatedAt;
          const expirationDate = new Date(
            getTimestamp({
              offset: issueDate,
              amount: -Number(expires_in),
              scale: "seconds",
            }),
          );
          if (expirationDate < issueDate) {
            await refreshAtlassianToken(
              (integration as IIntegration)._id.toString(),
            );
          }
        }),
    );

    // TODO: use a proper messaging solution instead of plain API request
    const serviceUrl = process.env.DATA_PROCESSOR_URL as string;
    const { data: index } = await axios.post(`${serviceUrl}/build-index`, {
      organizationId: String(req.user!.organization._id),
      dataSources: dataSources,
    });

    return res.status(202).json({ index });
  }),
);

router.delete(
  "/:id",
  catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== "owner") {
      throw AppError({
        message: "Only owners can delete indexes",
        statusCode: 403,
      });
    }

    const { id } = req.params;
    const index = await indexModel.getOneById(id);
    if (!index) {
      throw AppError({ message: "No such embeddings db", statusCode: 404 });
    } else if (!req.user!.organization._id.equals(index.organization._id)) {
      throw AppError({
        message: "User is not a member of this organization",
        statusCode: 403,
      });
    }

    try {
      // Delete Vector DB index
      const vectorStore = getVectorStore(index.name, index.type);
      await vectorStore.deleteIndex();
    } catch (err) {
      console.log("Failed to delete vector index", err);
    }

    // Delete internal index
    await indexModel.deleteOneById(id);

    return res.status(200).json({ message: "Successfully deleted index" });
  }),
);

export { router };
