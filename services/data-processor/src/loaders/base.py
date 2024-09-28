from typing import List
from db.types import Integration
from llama_index.core.schema import Document

class BaseLoader:
    def __init__(self, name: str, integration: Integration):
        self.name = name
        self.integration = integration

    async def load(self) -> List[Document]:
        pass