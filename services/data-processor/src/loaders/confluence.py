import os
from typing import List
import requests
from loaders.readers.confluence import ConfluenceReader
from atlassian import Confluence

from db.db_types import Integration
from loaders.base import BaseLoader
from llama_index.core.schema import Document


ATLASSIAN_API_URL = "https://api.atlassian.com"


class ConfluenceLoader(BaseLoader):

    def __init__(self, integration: Integration):
        self.name = "ConfluenceLoader"
        self.integration = integration
        super().__init__(self.name, self.integration)

    async def load(self) -> List[Document]:
        integration_type = self.integration.type
        access_token = self.integration.credentials["access_token"]

        total_documents = []
        if integration_type == "oauth":
            client_id = os.getenv("ATLASSIAN_CLIENT_ID")
            response = requests.get(
                f"{ATLASSIAN_API_URL}/oauth/token/accessible-resources",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            cloud_instances = response.json()
            for cloud_instance in cloud_instances:
                cloud_id = cloud_instance["id"]
                base_url = f"{ATLASSIAN_API_URL}/ex/confluence/{cloud_id}"
                token = {"access_token": access_token, "token_type": "bearer"}
                oauth2 = {"client_id": client_id, "token": token}

                # Get all Confluence spaces. Limit is 500 spaces for now
                confluence = Confluence(url=base_url, oauth2=oauth2)
                spaces_response = confluence.get_all_spaces(
                    start=0, limit=500, expand=None
                )
                spaces = spaces_response["results"]

                for space in spaces:
                    loader = ConfluenceReader(base_url=base_url, oauth2=oauth2)
                    documents = loader.load_data(
                        space_key=space["key"], page_status="current"
                    )
                    total_documents.extend(documents)
        else:
            email = self.integration.credentials["email"]
            site_url = self.integration.metadata["site_url"]
            base_url = f"https://{site_url}/wiki"
            confluence = Confluence(
                url=base_url, username=email, password=access_token, cloud=True
            )
            spaces_response = confluence.get_all_spaces(start=0, limit=500, expand=None)
            spaces = spaces_response["results"]

            for space in spaces:
                loader = ConfluenceReader(
                    base_url=base_url, username=email, password=access_token
                )
                documents = loader.load_data(
                    space_key=space["key"], page_status="current"
                )
                total_documents.extend(documents)

        # Adding the global "source" metadata field
        for document in total_documents:
            document.metadata["source"] = "Confluence"

        return total_documents
