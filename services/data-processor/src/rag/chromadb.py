import chromadb
from chromadb.config import Settings
from llama_index.vector_stores.chroma import (
    ChromaVectorStore as LIChromaVectorStore,
)
from rag.base import BaseVectorStore


class ChromaDBVectorStore(BaseVectorStore):
    def __init__(
        self,
        host: str,
        port: int,
        api_key: str,
        ssl: bool,
        collection_name: str,
    ):
        self.collection_name = collection_name
        settings = Settings(
            chroma_auth_token_transport_header="X_CHROMA_TOKEN",
            chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
            chroma_client_auth_credentials=api_key,
        )
        self.chroma = chromadb.HttpClient(
            host=host, port=port, settings=settings, ssl=ssl
        )

    def get_llama_index_store(self):
        return LIChromaVectorStore(chroma_collection=self.get_index())

    def get_index(self):
        return self.chroma.get_collection(name=self.collection_name)

    async def is_index_live(self):
        try:
            self.get_index()
            return True
        except Exception:
            return False

    async def create_index(self) -> None:
        return self.chroma.create_collection(name=self.collection_name)

    async def delete_index(self) -> None:
        return self.chroma.delete_collection(name=self.collection_name)
