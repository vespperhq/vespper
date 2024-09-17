import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { RunContext } from "../../types";
import { buildOutput } from "../utils";
import { indexModel } from "@merlinn/db";
import { getVectorStore, nodesToText } from "../../rag";

function normalizeCosineScore(score: number): number {
  // Cosine similarity ranges from -1 to 1
  // Normalize to a range of 0 to 100
  const normalizedScore = ((score + 1) / 2) * 100;

  return Math.round(normalizedScore);
}

export default async function (context: RunContext) {
  const index = await indexModel.getOne({
    organization: context.organizationId,
  });
  return Promise.resolve(
    new DynamicStructuredTool({
      name: "semantic_search",
      description: `Perform semantic search across multiple sources of information, and get top 5 results.`,
      func: async ({ query }) => {
        try {
          if (!index) {
            return "Knowledge base is not set up. Tool is not available.";
          }
          const vectorStore = getVectorStore(index.name, index.type);
          const documents = await vectorStore.query({ query, topK: 3 });
          documents.sort((a, b) => b.score - a.score);

          const text = nodesToText(documents);

          // Create sources
          const sourcesCounter: Record<string, number> = {};
          const sources = documents.map((document) => {
            const {
              url,
              title = "",
              score,
            } = (() => {
              let url;
              let title;
              switch (document.metadata.source) {
                case "Notion": {
                  const { workspace_name, page_id } = document.metadata;
                  url = `https://www.notion.so/${workspace_name}/${page_id.replaceAll("-", "")}`;
                  break;
                }
                case "Slack": {
                  const { workspace_url, channel_id, ts } = document.metadata;
                  url = `${workspace_url}/archives/${channel_id}/p${ts}`;
                  break;
                }
                case "Github": {
                  const {
                    url: githubUrl,
                    repo_path,
                    file_path,
                    file_name,
                    commit_sha,
                    doc_type,
                  } = document.metadata;
                  title =
                    doc_type === "code_file"
                      ? file_name
                      : doc_type === "issue"
                        ? `Issue #${githubUrl.split("/").pop()}`
                        : null;
                  if (githubUrl) {
                    const formattedUrl = githubUrl.replace(
                      /api\.github\.com\/[^/]+/,
                      "github.com",
                    );
                    url = formattedUrl;
                    break;
                  }

                  const [owner, repo] = repo_path.split("/");
                  const filePath = file_path.split(`${repo}/`)[1];
                  const manualUrl = `https://github.com/${owner}/${repo}/tree/${commit_sha}/${filePath}`;
                  url = manualUrl;
                  break;
                }
                case "PagerDuty": {
                  url = document.metadata.link;
                  title = "PagerDuty Alert";
                  break;
                }
                case "Jira":
                case "Confluence": {
                  url = document.metadata.url;
                  title = document.metadata.title;
                  break;
                }
                default: {
                  throw new Error("Unsupported source");
                }
              }

              return { url, title, score: document.score };
            })();

            sourcesCounter[document.metadata.source] =
              (sourcesCounter[document.metadata.source] || 0) + 1;
            const nSource = sourcesCounter[document.metadata.source];

            const suffix = nSource && nSource > 1 ? ` #${nSource}` : "";
            const normalizedScore = normalizeCosineScore(score);
            let sourceName =
              title ||
              (`${document.metadata.source.trim()} Link${suffix}` as string);
            sourceName = `${sourceName} (Score: ${normalizedScore}%)`;
            return { sourceName, url };
          });

          // Sort chunks coming from the same source document
          const uniqueSources = sources.filter(
            (source, index, self) =>
              self.findIndex((s) => s.url === source.url) === index,
          );

          // Create markdown links for sources
          const sourcesMkdown = uniqueSources.map(
            ({ sourceName, url }) => `[${sourceName}](${url})`,
          );

          const output = buildOutput(text, sourcesMkdown);
          return output;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error(error);
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
