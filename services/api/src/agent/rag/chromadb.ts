import { ChromaClient, IncludeEnum } from "chromadb";
import { VectorStore, Document } from "./types";
import { embedModel } from "../model";

export class ChromaDBVectorStore implements VectorStore {
  private readonly chroma: ChromaClient;
  private readonly collectionName: string;

  constructor(host: string, apiKey: string, collectionName: string) {
    this.chroma = new ChromaClient({
      path: host,
      auth: {
        provider: "token",
        credentials: apiKey,
        tokenHeaderType: "X_CHROMA_TOKEN",
      },
    });
    this.collectionName = collectionName;
  }

  async query(query: string, topK: number = 5): Promise<Document[]> {
    const vector = await embedModel.getTextEmbedding(query);

    const collection = await this.chroma.getCollection({
      name: this.collectionName,
    });

    const response = await collection.query({
      queryEmbeddings: vector,
      nResults: topK,
      include: [IncludeEnum.Metadatas],
    });

    if (!response.documents) {
      return [];
    }
    const documents = [];
    const batch = 0; // Chroma can run a batch of queries. Right now, we don't use it;
    for (let i = 0; i < response.documents.length; i++) {
      const id = response.ids[i] as unknown as string;
      const text = response.documents[batch][i] ?? "";
      const score = (
        response.distances ? response.distances[batch][i] : 0
      ) as number;
      const metadata = response.metadatas[batch][i] || {};
      const embedding = (response.embeddings
        ? response.embeddings[i]
        : []) as unknown as number[];

      const document: Document = {
        id,
        embedding,
        score,
        text,
        metadata,
      };

      documents.push(document);
    }
    return documents;
  }

  async deleteIndex(): Promise<void> {
    return await this.chroma.deleteCollection({ name: this.collectionName });
  }
}

(async () => {
  const host = "http://localhost:8000";
  const apiKey = "secret-token";
  const indexName = "664c47cebe04f2cb1b630e30";
  const chromaDB = new ChromaDBVectorStore(host, apiKey, indexName);

  const query = "What are our KPIs?";
  const documents = await chromaDB.query(query, 5);
  console.log(documents);
})();
