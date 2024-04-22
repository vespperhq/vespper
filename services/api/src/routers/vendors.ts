import express, { Request, Response } from "express";
import { vendorModel } from "@merlinn/db";
import { checkJWT, getDBUser } from "../middlewares/auth";
import { catchAsync } from "../utils/errors";

const router = express.Router();
router.use(checkJWT);
router.use(getDBUser);

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const vendors = await vendorModel.get({});

    return res.status(200).json(vendors);
  }),
);

export { router };
