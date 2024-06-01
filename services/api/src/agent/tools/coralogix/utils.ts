import { getTimestamp } from "../../../utils/dates";
import { CoralogixRegionKey } from "../../../types";
import { CoralogixClient } from "../../../clients";

function getKeys(obj: Record<string, unknown>, path: string[] = []): string[] {
  let result: string[] = [];

  for (const key in obj) {
    const currentPath = [...path, key];

    if (typeof obj[key] === "object" && obj[key] !== null) {
      result = result.concat(
        getKeys(obj[key] as Record<string, unknown>, currentPath),
      );
    } else {
      result.push(currentPath.join("."));
    }
  }

  return result;
}

export const getCommonLogFields = async (
  apiKey: string,
  region: CoralogixRegionKey,
): Promise<string[]> => {
  const startDate = String(getTimestamp({ amount: 7, scale: "days" }));
  const endDate = String(getTimestamp({}));

  const client = new CoralogixClient({ logsKey: apiKey }, region);
  const { result } = await client.getLogs({
    query: "source logs | limit 1000",
    startDate,
    endDate,
  });
  const logs = result.results;
  const fields = logs.reduce((total, current) => {
    const data = JSON.parse(current.userData);
    const keys = getKeys(data);
    keys.forEach((key) => total.add(key));
    return total;
  }, new Set());

  return Array.from(fields) as string[];
};

export const getCommonLogValues = async (
  field: string,
  apiKey: string,
  region: CoralogixRegionKey,
) => {
  const startDate = String(getTimestamp({ amount: 7, scale: "days" }));
  const endDate = String(getTimestamp({}));

  const client = new CoralogixClient({ logsKey: apiKey }, region);
  const query = `source logs | distinct ${field} | limit 100`;
  const { result } = await client.getLogs({
    query,
    startDate,
    endDate,
  });

  const values = result.results.map(
    (obj) => Object.values(JSON.parse(obj.userData))[0],
  );
  return values;
};

export const getLogSample = async (
  logsKey: string,
  region: "EU1" | "AP1" | "US1" | "EU2" | "AP2" | "US2",
  amount: number = 5,
) => {
  const startDate = getTimestamp({ amount: 7, scale: "days" });
  const endDate = new Date().toISOString();

  const client = new CoralogixClient({ logsKey }, region);
  const query = `source logs | limit ${amount}`;
  const result = await client.getLogs({
    syntax: "QUERY_SYNTAX_DATAPRIME",
    query,
    startDate,
    endDate,
  });
  if (!result.result?.results) {
    return [];
  }

  const rows = result.result?.results.map((o) => JSON.parse(o.userData));
  return rows;
};

export const getPrettyLogSample = async (
  logsKey: string,
  region: "EU1" | "AP1" | "US1" | "EU2" | "AP2" | "US2",
  amount: number = 5,
) => {
  const logSample = await getLogSample(logsKey, region, amount);
  const formattedLogSample = logSample
    .map((log) =>
      Object.entries(log)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
    )
    .join("\n\n--------------------------------------\n\n");

  return formattedLogSample;
};
