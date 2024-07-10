import { PineconeVectorStore } from "./pinecone";
import { ChromaDBVectorStore } from "./chromadb";

export function getVectorStore(
  indexName: string,
  indexType: "pinecone" | "chromadb",
) {
  switch (indexType) {
    case "pinecone":
      if (!process.env.PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY is required for Pinecone");
      }
      return new PineconeVectorStore(process.env.PINECONE_API_KEY, indexName);
    case "chromadb":
      if (!process.env.CHROMA_HOST || !process.env.CHROMA_API_KEY) {
        throw new Error(
          "CHROMA_HOST and CHROMA_API_KEY are required for ChromaDB",
        );
      }
      return new ChromaDBVectorStore(
        process.env.CHROMA_HOST as string,
        process.env.CHROMA_API_KEY as string,
        indexName,
      );
    default:
      throw new Error(`Invalid index source: ${indexType}`);
  }
}
