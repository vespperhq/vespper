import { add, formatDistance } from "date-fns";

export type Timescale =
  | "years"
  | "months"
  | "weeks"
  | "days"
  | "hours"
  | "minutes"
  | "seconds";

export enum Timeframe {
  Last1Minute = "Last 1 minute",
  Last2Minutes = "Last 2 minutes",
  Last5Minutes = "Last 5 minutes",
  Last15Minutes = "Last 15 minutes",
  Last30Minutes = "Last 30 minutes",
  Last1Hour = "Last 1 hour",
  Last2Hours = "Last 2 hours",
  Last6Hours = "Last 6 hours",
  Last12Hours = "Last 12 hours",
  Last24Hours = "Last 24 hours",
  Last2Days = "Last 2 days",
  Last3Days = "Last 3 days",
  Last5Days = "Last 5 days",
  Last7Days = "Last 7 days",
}

export const timeframe2values: Record<Timeframe, [number, Timescale]> = {
  [Timeframe.Last1Minute]: [1, "minutes"],
  [Timeframe.Last2Minutes]: [2, "minutes"],
  [Timeframe.Last5Minutes]: [5, "minutes"],
  [Timeframe.Last15Minutes]: [15, "minutes"],
  [Timeframe.Last30Minutes]: [30, "minutes"],
  [Timeframe.Last1Hour]: [1, "hours"],
  [Timeframe.Last2Hours]: [2, "hours"],
  [Timeframe.Last6Hours]: [6, "hours"],
  [Timeframe.Last12Hours]: [12, "hours"],
  [Timeframe.Last24Hours]: [24, "hours"],
  [Timeframe.Last2Days]: [2, "days"],
  [Timeframe.Last3Days]: [3, "days"],
  [Timeframe.Last5Days]: [5, "days"],
  [Timeframe.Last7Days]: [7, "days"],
};
interface GetTimestampParams {
  offset?: string | number | Date;
  amount?: number;
  scale?: Timescale;
}

export function getTimestamp({
  offset,
  amount = 0,
  scale = "seconds",
}: GetTimestampParams) {
  const date = offset ? offset : new Date().toISOString();
  const newDate = add(date, { [scale]: -amount });

  return newDate.toISOString();
}

export function getDistance(date: Date) {
  return formatDistance(date, new Date(), { addSuffix: true });
}
