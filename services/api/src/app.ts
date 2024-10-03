import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import {
  webhooksRouter,
  chatRouter,
  usersRouter,
  integrationsRouter,
  vendorsRouter,
  inviteRouter,
  organizationsRouter,
  indexRouter,
  featuresRouter,
  jobsRouter,
} from "./routers";
import { errorHandler, invalidPathHandler } from "./middlewares/errors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.DASHBOARD_APP_URL,
  }),
);
app.use(cookieParser());
app.use(bodyParser.json({ limit: "1mb" }));
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  return res.status(200).send("Vespper API 😊");
});

// Attach routers to app
app.use("/users", usersRouter);
app.use("/webhooks", webhooksRouter);
app.use("/chat", chatRouter);
app.use("/integrations", integrationsRouter);
app.use("/vendors", vendorsRouter);
app.use("/invite", inviteRouter);
app.use("/organizations", organizationsRouter);
app.use("/index", indexRouter);
app.use("/features", featuresRouter);
app.use("/jobs", jobsRouter);
app.all("*", invalidPathHandler); // Handle 404

// Global error handler
app.use(errorHandler);

export { app };
