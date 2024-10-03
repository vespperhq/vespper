from abc import ABC, abstractmethod


class BaseStorage(ABC):
    @abstractmethod
    async def save(self, data, file_path):
        pass

    @abstractmethod
    async def load(self, file_path):
        pass

    @abstractmethod
    async def delete(self, file_path):
        pass

    @abstractmethod
    async def list(self, directory_path):
        pass

    @abstractmethod
    async def exists(self, file_path):
        pass
