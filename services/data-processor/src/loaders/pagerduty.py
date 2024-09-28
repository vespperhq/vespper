from typing import List
from db.types import Integration
from loaders.readers.pagerduty import PagerDutyReader

from db.types import Integration
from loaders.base import BaseLoader
from llama_index.core.schema import Document


class PagerDutyLoader(BaseLoader):
    def __init__(self, integration: Integration):
        self.name = "PagerDutyLoader"
        self.integration = integration
        super().__init__(self.name, self.integration)

    async def load(self) -> List[Document]:
        access_token = self.integration.credentials["access_token"]
        token_type = self.integration.type
        loader = PagerDutyReader(access_token, token_type)
        documents = await loader.load_data()

        return documents
