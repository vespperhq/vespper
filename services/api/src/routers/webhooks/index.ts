import express, { Request, Response } from "express";
import { webhookModel, vendorModel, organizationModel } from "@vespper/db";
import { router as oryRouter } from "./ory";
import { checkAuth, getDBUser } from "../../middlewares/auth";

const router = express.Router();
router.use("/ory", oryRouter);

router.use(checkAuth);
router.use(getDBUser);

router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    const webhooks = await webhookModel
      .get({
        organization: user!.organization._id,
      })
      .populate("vendor");

    return res.status(200).json(webhooks);
  } catch (error) {
    console.log("error: ", error);
    return res.status(500).json(error);
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { vendorName, organizationId, secret } = req.body;

  const vendor = await vendorModel.getOne({ name: vendorName });
  const organization = await organizationModel.getOneById(organizationId);
  if (!vendor) {
    console.log("Could not find the vendor. Make sure a vendor is defined.");
    return res
      .status(404)
      .send("Could not find the vendor. Make sure a vendor is defined.");
  } else if (!organization) {
    console.log("Could not find the given organization.");
    return res.status(404).send("Could not find the given organization.");
  }

  if (req.user!.role !== "owner") {
    return res.status(403).json({ message: "Only owners can add webhooks" });
  } else if (!req.user!.organization._id.equals(organizationId)) {
    const error = "User is not a member of this organization";
    console.log(error);
    return res.status(403).json({ error });
  }

  const webhook = await webhookModel.create({
    vendor,
    organization,
    secret,
  });

  return res.status(200).json({ webhook });
});

export { router };
