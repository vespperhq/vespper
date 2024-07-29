export enum ErrorCode {
  NO_INTERNAL_USER = 29,
  NO_BETA_ACCESS = 30,
  INVITATION_NOT_ACCEPTED = 31,
  NO_INTEGRATION = 32,
  AGENT_RUN_FAILED = 33,
  MODEL_RUN_FAILED = 34,
  MODERATION_FAILED = 35,
  QUOTA_EXCEEDED = 36,
  NO_INDEX = 37,
}

export interface ErrorPayload {
  message: string;
  statusCode: number;
  internalCode?: ErrorCode;
  stack?: string;
  context?: Record<string, unknown>;
}

export const AppError = ({
  message,
  statusCode,
  internalCode,
  stack,
  context,
}: ErrorPayload) => {
  const status = `${statusCode}`.startsWith("4") ? "fail" : "error";

  const appError = {
    message,
    statusCode,
    status,
    internalCode,
    context,
    stack,
    toJSON() {
      return {
        message: this.message,
        status: this.status,
        statusCode: this.statusCode,
        internalCode: this.internalCode,
      };
    },
  };

  Error.captureStackTrace(appError, AppError);

  return appError;
};
