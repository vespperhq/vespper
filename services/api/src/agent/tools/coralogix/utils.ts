import { DATAPRIME_CHEATSHEET } from "./constants";
import { getTimestamp } from "../../../utils/dates";
import { chatModel } from "../../model";
import { replaceSuccessiveQuotes } from "../../../utils/strings";
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
    query: "source logs | limit 100",
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

function extractQuery(text: string): string | null {
  // Regular expression to match the Query line and capture its value
  const queryRegex = /Query:(.*)/s;

  const match = text.match(queryRegex);

  if (match && match[1]) {
    return match[1].trim();
  } else {
    return null;
  }
}

export const textToQuery = async (
  apiKey: string,
  region: CoralogixRegionKey,
  text: string,
  feedback?: string[],
  fields?: string[],
) => {
  // If custom fields are not given, we use all the fields based on
  // log sample
  const _fields: string[] =
    fields || (await getCommonLogFields(apiKey, region));

  let prompt = `
  The following is a Cheatsheet of Coralogix's DataPrime query language:
  ----------------------------------------------------------------------
  ${DATAPRIME_CHEATSHEET}
  ----------------------------------------------------------------------

  Given the following Coralogix log fields:
  ${_fields}
    
  Can you please generate a DataPrime query from the following description:
  ${text}

  Return your answer as:
  Query: "your query"
  `;

  if (feedback && feedback.length > 0) {
    prompt += feedback
      .map((f) => {
        const [query, result] = f.split(":&:");
        return `Your previous attempt was failed. query: ${query}, result: ${result}.`;
      })
      .join(",");
  }
  const output = await chatModel.invoke(prompt);

  let query = extractQuery(output.content as string);
  if (!query) {
    return null;
  }
  query = query.replaceAll("\n", ""); // ChatGPT sometimes add new lines because it is shown in the cheatsheet
  query = query.replaceAll('"', "'"); // Replace double quotes with single quotes
  query = replaceSuccessiveQuotes(query);

  return query;
};
