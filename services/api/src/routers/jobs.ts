import express, { Request, Response } from "express";
import { jobModel } from "@vespper/db";
import { checkAuth, getDBUser } from "../middlewares/auth";
import { catchAsync } from "../utils/errors";

const router = express.Router();
router.use(checkAuth);
router.use(getDBUser);

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const jobs = await jobModel.get(req.query);
    return res.status(200).json(jobs);
  }),
);

export { router };
