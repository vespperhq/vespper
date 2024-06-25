import { startPlanStateJobs, stopPlanStateJobs } from "../services/plans";

export function startAllJobs() {
  startPlanStateJobs();
  console.log("Cron jobs started");
}

export function stopAllJobs() {
  stopPlanStateJobs();
  console.log("Cron jobs stopped");
}
