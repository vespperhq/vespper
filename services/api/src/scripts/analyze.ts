import { connectToDB } from "@merlinn/db";
import { runRCA } from "../services/rca";
import type { EventSource } from "../types/internal";

(async () => {
  await connectToDB(process.env.MONGO_URI as string);

  // Get the command line arguments
  console.log(process.argv.slice(2));
  const args = process.argv.slice(2);

  const eventId = args[0];
  const organizationId = args[1];
  const eventSource = args[2] as EventSource;

  const response = await runRCA(eventId, eventSource, organizationId);

  console.log(response);
})();
