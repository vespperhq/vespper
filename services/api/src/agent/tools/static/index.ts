import { indexModel } from "@merlinn/db";
import { default as semanticSearch } from "./semantic_search";
import { RunContext } from "../../../agent/types";

export async function createToolLoaders(context: RunContext) {
  const toolLoaders = [];

  // If there is an index configured, we can use semantic search tool
  const index = await indexModel.getOne({
    organization: context.organizationId,
  });
  if (index) {
    toolLoaders.push(semanticSearch);
  }
  return toolLoaders;
}
