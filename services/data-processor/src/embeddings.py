from typing import List
from litellm import embedding

from llama_index.core.bridge.pydantic import Field
from llama_index.core.embeddings import BaseEmbedding


def get_embeddings(api_base: str, model_name: str, input: List[str]):
    response = embedding(
        api_base=api_base,
        model=model_name,
        input=input,
    )
    embeddings = [result["embedding"] for result in response.data]
    return embeddings


class LiteLLMEmbeddings(BaseEmbedding):
    model_name: str = Field(
        default="unknown", description="The name of the embedding model."
    )
    api_base: str = Field(
        default="unknown", description="The base URL of the LiteLLM proxy."
    )

    @classmethod
    def class_name(cls) -> str:
        return "lite-llm"

    async def _aget_query_embedding(self, query: str) -> List[float]:
        return self._get_query_embedding(query)

    async def _aget_text_embedding(self, text: str) -> List[float]:
        return self._get_text_embedding(text)

    def _get_query_embedding(self, query: str) -> List[float]:
        embeddings = get_embeddings(self.api_base, self.model_name, [query])
        return embeddings[0]

    def _get_text_embedding(self, text: str) -> List[float]:
        embeddings = get_embeddings(self.api_base, self.model_name, [text])
        return embeddings[0]

    def _get_text_embeddings(self, texts: List[str]) -> List[List[float]]:
        embeddings = get_embeddings(self.api_base, self.model_name, texts)
        return embeddings
