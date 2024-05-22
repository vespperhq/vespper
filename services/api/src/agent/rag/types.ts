export interface Document {
  id: string;
  text: string;
  score: number;
  embedding: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

export interface QueryOptions {
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  topK?: number;
}

export interface VectorStore {
  query(options: QueryOptions): Promise<Document[]>;
  deleteIndex(indexName: string): Promise<void>;
}
