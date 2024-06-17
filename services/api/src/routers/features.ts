import express, { Request, Response } from "express";
import { checkAuth, getDBUser } from "../middlewares/auth";
import { catchAsync } from "../utils/errors";

const router = express.Router();
router.use(checkAuth);
router.use(getDBUser);

router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const smtpConnectionUrl = process.env.SMTP_CONNECTION_URL as string;
    const features = {
      isInviteMembersEnabled: !!smtpConnectionUrl,
    };
    return res.status(200).json(features);
  }),
);

export { router };
