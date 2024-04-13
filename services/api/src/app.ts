import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import {
  oauthRouter,
  webhooksRouter,
  chatRouter,
  usersRouter,
  integrationsRouter,
  vendorsRouter,
  inviteRouter,
  organizationsRouter,
  indexRouter,
} from "./routers";
import { errorHandler, invalidPathHandler } from "./middlewares/errors";

const app = express();

app.use(cors());

app.use(bodyParser.json({ limit: "1mb" }));
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  return res.status(200).send("Merlinn API!!!");
});

// Attach routers to app
app.use("/users", usersRouter);
app.use("/oauth", oauthRouter);
app.use("/webhooks", webhooksRouter);
app.use("/chat", chatRouter);
app.use("/integrations", integrationsRouter);
app.use("/vendors", vendorsRouter);
app.use("/invite", inviteRouter);
app.use("/organizations", organizationsRouter);
app.use("/index", indexRouter);

app.all("*", invalidPathHandler); // Handle 404

// Global error handler
app.use(errorHandler);

export { app };
