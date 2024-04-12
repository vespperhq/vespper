import {
  Pinecone,
  QueryResponse,
  RecordMetadata,
} from "@pinecone-database/pinecone";
import { embedModel } from "./model";
import { TextNode } from "llamaindex";

function metadataToNode(
  metadata?: RecordMetadata | undefined,
): Partial<TextNode> {
  if (!metadata) {
    throw new Error("metadata is undefined.");
  }

  const nodeContent = metadata["_node_content"];
  if (!nodeContent) {
    throw new Error("nodeContent is undefined.");
  }

  if (typeof nodeContent !== "string") {
    throw new Error("nodeContent is not a string.");
  }

  return JSON.parse(nodeContent);
}

function responseToNodes(response: QueryResponse<RecordMetadata>) {
  const topKIds: string[] = [];
  const topKNodes: TextNode[] = [];
  const topKScores: number[] = [];
  if (response.matches) {
    for (const match of response.matches) {
      match.metadata;
      const node = new TextNode({
        ...metadataToNode(match.metadata),
        embedding: match.values,
      });

      topKIds.push(match.id);
      topKNodes.push(node);
      topKScores.push(match.score ?? 0);
    }
  }

  const result = {
    ids: topKIds,
    nodes: topKNodes,
    similarities: topKScores,
  };

  return result;
}

export function nodesToText(nodes: TextNode[], similarities: number[]) {
  const formattedNodes = nodes.map(
    (node, index) =>
      `Document: ${index + 1}\nSource: ${node.metadata.source}\nScore: ${
        similarities[index]
      }\nMetadata: ${JSON.stringify(node.metadata)}\nText: ${node.text}`,
  );
  return formattedNodes.join("\n\n");
}

export async function semanticSearch(
  query: string,
  indexName: string,
  topK = 5,
  textify = false,
) {
  const vector = await embedModel.getTextEmbedding(query);
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
  const response = await pc
    .index(indexName)
    .query({ topK, vector, includeMetadata: true });

  const result = responseToNodes(response);
  if (textify) {
    const text = nodesToText(result.nodes, result.similarities);
    return text;
  }

  return result;
}
