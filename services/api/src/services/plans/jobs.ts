import cron from "node-cron";
import { resetPlanStates } from "./base";
import { ResetMode } from "../../types";

// TODO: move these jobs to a different service maybe
const hourlyJob = cron.schedule("0 * * * *", async () => {
  await resetPlanStates(ResetMode.hourly);
});

const dailyJob = cron.schedule("0 0 * * *", async () => {
  await resetPlanStates(ResetMode.daily);
});

const weeklyJob = cron.schedule("0 0 * * 0", async () => {
  await resetPlanStates(ResetMode.weekly);
});

const monthlyJob = cron.schedule("0 0 1 * *", async () => {
  await resetPlanStates(ResetMode.monthly);
});

const yearlyJob = cron.schedule("0 0 1 1 *", async () => {
  await resetPlanStates(ResetMode.yearly);
});

export function startPlanStateJobs() {
  hourlyJob.start();
  dailyJob.start();
  weeklyJob.start();
  monthlyJob.start();
  yearlyJob.start();
}

export function stopPlanStateJobs() {
  hourlyJob.stop();
  dailyJob.stop();
  weeklyJob.stop();
  monthlyJob.stop();
  yearlyJob.stop();
}
