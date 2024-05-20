import { PineconeVectorStore } from "./pinecone";

export function getVectorStore(
  indexName: string,
  indexSource: "pinecone" | "chromadb",
) {
  if (indexSource === "pinecone") {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is required for Pinecone");
    }
    return new PineconeVectorStore(process.env.PINECONE_API_KEY, indexName);
  } else if (indexSource === "chromadb") {
    if (!process.env.CHROMADB_HOST || !process.env.CHROMADB_API_KEY) {
      throw new Error(
        "CHROMADB_HOST and CHROMADB_API_KEY are required for ChromaDB",
      );
    }
    // return new ChromaDBVectorBackend(process.env.CHROMADB_HOST, process.env.CHROMADB_API_KEY, indexName);
    return new PineconeVectorStore(
      process.env.PINECONE_API_KEY as string,
      indexName,
    );
  }
  throw new Error(`Invalid index source: ${indexSource}`);
}
