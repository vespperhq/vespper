from abc import ABC, abstractmethod


class BaseVectorStore(ABC):
    @abstractmethod
    def get_llama_index_store(self):
        pass

    @abstractmethod
    def get_index(self):
        pass

    @abstractmethod
    def is_index_live(self):
        pass

    @abstractmethod
    async def create_index(self) -> None:
        pass

    @abstractmethod
    async def delete_index(self) -> None:
        pass
