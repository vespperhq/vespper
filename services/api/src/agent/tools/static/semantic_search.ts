import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { RunContext } from "../../types";
import { nodesToText, semanticSearch } from "../../rag";
import { buildOutput } from "../utils";

export default async function (context: RunContext) {
  return Promise.resolve(
    new DynamicStructuredTool({
      name: "semantic_search",
      description: `Perform semantic search across multiple sources of information, and get top 5 results.`,
      func: async ({ query }) => {
        try {
          const indexName = context.organizationId;
          const { nodes, similarities } = await semanticSearch(
            query,
            indexName,
            3,
          );
          const text = nodesToText(nodes, similarities);

          // Create sources
          const sourcesCounter: Record<string, number> = {};
          const sources = nodes.map((node) => {
            const url = (() => {
              switch (node.metadata.source) {
                case "Notion": {
                  const { workspace_name, page_id } = node.metadata;
                  return `https://www.notion.so/${workspace_name}/${page_id.replaceAll("-", "")}`;
                }
                case "Slack": {
                  const { workspace_url, channel_id, ts } = node.metadata;
                  return `${workspace_url}/archives/${channel_id}/p${ts}`;
                }
                case "Github": {
                  return node.metadata.url;
                }
              }
            })();

            sourcesCounter[node.metadata.source] =
              (sourcesCounter[node.metadata.source] || 0) + 1;
            const nSource = sourcesCounter[node.metadata.source];

            const suffix = nSource && nSource > 1 ? ` #${nSource}` : "";
            const source = `<${url}|${node.metadata.source.trim()} Link${suffix}>`;
            return source;
          });
          const output = buildOutput(text, sources);
          return output;

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
