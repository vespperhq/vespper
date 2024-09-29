from typing import List
from pinecone import Pinecone, ServerlessSpec
from llama_index.vector_stores.pinecone import (
    PineconeVectorStore as LIPineconeVectorStore,
)
from rag.base import BaseVectorStore


class PineconeVectorStore(BaseVectorStore):
    def __init__(self, api_key: str, index_name: str):
        self.pinecone = Pinecone(api_key=api_key)
        self.index_name = index_name

    def get_llama_index_store(self):
        return LIPineconeVectorStore(pinecone_index=self.get_index())

    def get_index(self):
        return self.pinecone.Index(self.index_name)

    async def is_index_live(self):
        try:
            self.pinecone.describe_index(self.index_name)
            return True
        except Exception:
            return False

    async def create_index(self) -> None:
        return self.pinecone.create_index(
            name=self.index_name,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )

    async def delete_index(self) -> None:
        return self.pinecone.delete_index(self.index_name)
