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
      } else if (error.message) {
        next(new AppError(error.message, 500));
      } else {
        next(new AppError("Internal error", 500));
      }
    });
  };
};
