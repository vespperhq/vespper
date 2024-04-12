import { analyticsListener } from "./analytics/listener";
import { app } from "./app";
import { connectToDB } from "./db";
import { startAllJobs } from "./jobs";
import { notificationsListener } from "./notifications";

init();

async function init() {
  const port = process.env.PORT || 3000;
  const mongoUri = process.env.MONGO_URI as string;

  // Connect to DB
  await connectToDB(mongoUri);

  // Start all cron jobs
  await startAllJobs();

  // Listen to events and notify & track analytics
  notificationsListener.listen();
  analyticsListener.listen();

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
