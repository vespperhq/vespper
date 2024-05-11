import { default as queryPrometheus } from "./query";
import { default as metricsExplorer } from "./metrics_explorer";
import { default as getAlerts } from "./get_alerts";

export const toolLoaders = [queryPrometheus, metricsExplorer, getAlerts];
