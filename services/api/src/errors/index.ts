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

export class AppError extends Error {
  public override readonly message: string;
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly internalCode?: ErrorCode;
  constructor(message: string, statusCode: number, internalCode?: ErrorCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.internalCode = internalCode;
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      message: this.message,
      status: this.status,
      statusCode: this.statusCode,
      internalCode: this.internalCode,
    };
  }
}
