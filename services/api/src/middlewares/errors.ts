import { Request, Response, NextFunction } from "express";
import { AppError, ErrorPayload } from "../errors";
import { PostHogClient } from "../telemetry/posthog";
import { uuid } from "uuidv4";

const captureErrorInTelemetry = (error: ErrorPayload, req: Request) => {
  const posthog = new PostHogClient();

  const distinctId = req.user?._id.toString() || uuid();

  posthog.capture({
    event: "app_error",
    distinctId,
    properties: {
      message: error.message,
      context: error.context,
    },
  });
};
const productionError = (error: ErrorPayload, req: Request, res: Response) => {
  captureErrorInTelemetry(error, req);

  // Send a lean error message
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    code: error.internalCode,
  });
};

// Send a detailed error message, for debugging purposes
const developmentError = (error: ErrorPayload, req: Request, res: Response) => {
  console.error("developmentError error: ", error);

  captureErrorInTelemetry(error, req);

  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    code: error.internalCode,
    error: error,
    stack: error.stack,
  });
};

export const errorHandler = (
  error: ErrorPayload,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  if (process.env.NODE_ENV === "development") {
    developmentError(error, req, res);
  } else if (process.env.NODE_ENV === "production") {
    // TODO: we should use a logger here
    console.log("\n\n------ begin: ------");
    console.log("ERROR: ", error);
    console.log("------ end: ------\n\n");
    productionError(error, req, res);
  }
};

export const invalidPathHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const error = AppError({
    message: `Path ${req.originalUrl} does not exist for ${req.method} method`,
    statusCode: 404,
    internalCode: undefined,
  });
  next(error);
};
