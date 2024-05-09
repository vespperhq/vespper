import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

// TODO: Once Express.js 5 is released, this wrapper will become redundant
// Hence, we won't need this wrapper: https://expressjs.com/en/guide/error-handling.html
export const catchAsync = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error) => {
      if (error instanceof AppError) {
        next(error);
      } else {
        const newError = new AppError(error.message || "Internal error", 500);
        newError.stack = error.stack;
        next(newError);
      }
    });
  };
};
