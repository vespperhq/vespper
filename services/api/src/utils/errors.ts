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
      if (error instanceof AppError) {
        next(error);
      } else {
        const newError = new AppError(error.message || "Internal error", 500);
        newError.stack = error.stack;
        next(newError);
      }
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
