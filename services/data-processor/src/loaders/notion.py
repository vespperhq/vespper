from typing import List
from db.db_types import Integration
from notion_client import Client
from loaders.readers.notion import NotionPageReader

from db.db_types import Integration
from loaders.base import BaseLoader
from llama_index.core.schema import Document


class NotionLoader(BaseLoader):
    def __init__(self, integration: Integration):
        self.name = "NotionLoader"
        self.integration = integration
        super().__init__(self.name, self.integration)

    async def load(self) -> List[Document]:
        client = Client(auth=self.integration.credentials["access_token"])
        response = client.search(filter={"value": "page", "property": "object"})
        pages = response["results"]
        page_ids = [page["id"] for page in pages]

        loader = NotionPageReader(self.integration.credentials["access_token"])
        documents = loader.load_data(page_ids=page_ids)

        # Adding the global "source" metadata field
        for document in documents:
            document.metadata["source"] = "Notion"
            document.metadata["workspace_name"] = self.integration.metadata.get(
                "workspace_name"
            )
            if self.integration.type == "oauth":
                document.metadata["workspace_id"] = self.integration.metadata[
                    "workspace_id"
                ]

        return documents
