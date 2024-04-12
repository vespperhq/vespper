import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { RunContext } from "../../types";
import { semanticSearch } from "../../rag";

export default async function (context: RunContext) {
  return Promise.resolve(
    new DynamicStructuredTool({
      name: "semantic_search",
      description: `Perform semantic search across multiple sources of information, and get top 5 results.`,
      func: async ({ query }) => {
        try {
          const indexName = context.organizationId;
          const text = (await semanticSearch(
            query,
            indexName,
            3,
            true,
          )) as string;
          return text;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          return JSON.stringify(error);
        }
      },
      schema: z.object({
        query: z
          .string()
          .describe("Free form query to search across all sources."),
      }),
    }),
  );
}
