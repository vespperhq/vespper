import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { getTimestamp } from "../../../utils/dates";

export default async function () {
  return Promise.resolve(
    new DynamicStructuredTool({
      name: "get_timestamp",
      description: `Gets a UTC timestamp, given amount, scale and . 
      For example, to get the timestamp of 5 days ago, amount should be 5 and scale should be days.
      If you want to get the current timestamp, simply omit amount and scale.`,
      func: async ({ amount, scale }) => {
        try {
          const timestamp = getTimestamp({ amount, scale });
          return String(timestamp);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          return JSON.stringify(error);
        }
      },
      schema: z.object({
        amount: z
          .number()
          .optional()
          .describe(
            "The amount of the calculated timestamp, relative to the present.",
          ),
        scale: z
          .enum([
            "years",
            "months",
            "weeks",
            "days",
            "hours",
            "minutes",
            "seconds",
          ])
          .optional()
          .describe(
            "The scale of the amount. Possible values are: years, months, weeks, days, hours, minutes, seconds;",
          ),
      }),
    }),
  );
}
