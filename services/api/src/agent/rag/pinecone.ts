import { VectorStore, Document } from "./types";
import {
  Pinecone,
  QueryResponse,
  RecordMetadata,
} from "@pinecone-database/pinecone";
import { embedModel } from "../model";
import { TextNode } from "llamaindex";

export class PineconeVectorStore implements VectorStore {
  private readonly pinecone: Pinecone;
  private readonly indexName: string;

  constructor(apiKey: string, indexName: string) {
    this.pinecone = new Pinecone({ apiKey });
    this.indexName = indexName;
  }

  async query(query: string, topK: number = 5): Promise<Document[]> {
    const vector = await embedModel.getTextEmbedding(query);
    const response = await this.pinecone
      .index(this.indexName)
      .query({ topK, vector, includeMetadata: true });

    return responseToDocuments(response);
  }

  async deleteIndex(): Promise<void> {
    return await this.pinecone.deleteIndex(this.indexName);
  }
}

function responseToDocuments(response: QueryResponse<RecordMetadata>) {
  const documents = [];
  for (const match of response.matches) {
    const { metadata = {}, ...data } = parseMetadata(match.metadata);

    const document: Document = {
      id: match.id,
      embedding: match.values,
      score: match.score ?? 0,
      text: data.text || "",
      metadata,
    };

    documents.push(document);
  }

  return documents;
}

function parseMetadata(
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
