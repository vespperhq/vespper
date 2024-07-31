import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

// TODO: Once Express.js 5 is released, this wrapper will become redundant
// Hence, we won't need this wrapper: https://expressjs.com/en/guide/error-handling.html
export const catchAsync = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleError = (error: any) => {
      const newError = AppError({
        message: error.message || "Internal error",
        statusCode: error.statusCode || 500,
        internalCode: error.internalCode || "internal_error",
        stack: error.stack,
        context: error.context,
      });
      newError.stack = error.stack;
      next(newError);
    };

    const isAsync = fn.constructor.name === "AsyncFunction";
    if (isAsync) {
      fn(req, res, next).catch(handleError);
    } else {
      try {
        fn(req, res, next);
      } catch (error) {
        handleError(error);
      }
    }
  };
};
