import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import type { CoralogixIntegration } from "@merlinn/db";
import { getCommonLogValues } from "./utils";

const TOOL_DESCRIPTION = `
This tool returns the distinct values for the given fields from Coralogix logs. 
Can be useful if you want to see the unique values for a field. For example, "environment" field might have values like "production", "staging", "development".
`;

export default async function (integration: CoralogixIntegration) {
  const { logsKey } = integration.credentials;
  const { region } = integration.metadata;

  return new DynamicStructuredTool({
    name: "get_distinct_log_values",
    description: TOOL_DESCRIPTION,
    func: async ({ fields }) => {
      try {
        const fieldsArray = fields.split(",");
        const commonValues = await Promise.all(
          fieldsArray.map(async (field) =>
            getCommonLogValues(field, logsKey, region),
          ),
        );

        const commonFields = fieldsArray.map((field, index) => {
          return {
            field,
            values: commonValues[index],
          };
        });
        return JSON.stringify(commonFields);
      } catch (error) {
        return `Error occured. Could not fetch common log fields.`;
      }
    },
    schema: z.object({
      fields: z
        .string()
        .describe(
          "The fields you wish to get unique/distinct values for. Should be comma separated. For example: field1,field2.",
        ),
    }),
  });
}
