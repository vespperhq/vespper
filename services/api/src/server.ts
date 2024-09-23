import { TelemetryListener } from "./telemetry/listener";
import { app } from "./app";
import { connectToDB } from "@vespper/db";
import { startAllJobs } from "./jobs";
import { NotificationsListener } from "./notifications";
import { isEnterprise } from "./utils/ee";
import { isTelemetryEnabled } from "./constants";

init();

async function init() {
  const port = process.env.PORT || 3000;
  const mongoUri = process.env.MONGO_URI as string;

  // Connect to DB
  await connectToDB(mongoUri);

  // Start all cron jobs
  await startAllJobs();

  // In enterprise, listen to events and notify
  if (isEnterprise()) {
    const notificationsListener = new NotificationsListener();
    notificationsListener.listen();
  }
  if (isTelemetryEnabled()) {
    const telemetryListener = new TelemetryListener();
    telemetryListener.listen();
  }

  try {
    app.listen(port, () => {
      console.log(`Server is listening on Port ${port}`);
    });
  } catch (error) {
    console.log(error);
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}
