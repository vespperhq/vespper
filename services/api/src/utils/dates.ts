import { add, formatDistance } from "date-fns";

export type Timescale =
  | "years"
  | "months"
  | "weeks"
  | "days"
  | "hours"
  | "minutes"
  | "seconds";

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
