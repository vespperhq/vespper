export interface Document {
  id: string;
  text: string;
  score: number;
  embedding: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

export interface VectorStore {
  query(query: string, topK: number): Promise<Document[]>;
  deleteIndex(indexName: string): Promise<void>;
}
