import os
from rag.pinecone import PineconeVectorStore
from rag.chromadb import ChromaDBVectorStore


def get_vector_store(index_name, index_type):
    if index_type == "pinecone":
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY is required for Pinecone")
        return PineconeVectorStore(api_key, index_name)
    elif index_type == "chromadb":
        host = os.getenv("CHROMADB_HOST")
        port = os.getenv("CHROMADB_PORT")
        ssl = os.getenv("CHROMADB_SSL", "false") == "true"
        api_key = os.getenv("CHROMADB_API_KEY")
        if not host or not api_key:
            raise ValueError(
                "CHROMADB_HOST and CHROMADB_API_KEY are required for ChromaDB"
            )
        return ChromaDBVectorStore(host, port, api_key, ssl, index_name)
    else:
        raise ValueError(f"Invalid index type: {index_type}")
