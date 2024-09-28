from typing import List
import requests
from datetime import datetime, timezone
from dateutil import parser
from loaders.readers.jira import JiraReader
from db.types import Integration

from db.types import Integration
from loaders.base import BaseLoader
from llama_index.core.schema import Document

JQL_QUERY = "issuetype is not EMPTY"
ATLASSIAN_API_URL = "https://api.atlassian.com"


class JiraLoader(BaseLoader):
    def __init__(self, integration: Integration):
        self.name = "JiraLoader"
        self.integration = integration
        super().__init__(self.name, self.integration)

    async def load(self) -> List[Document]:
        integration_type = self.integration.type
        total_documents = []
        if integration_type == "oauth":
            access_token = self.integration.credentials["access_token"]
            response = requests.get(
                f"{ATLASSIAN_API_URL}/oauth/token/accessible-resources",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            cloud_instances = response.json()
            for cloud_instance in cloud_instances:
                cloud_id = cloud_instance["id"]

                loader = JiraReader(
                    Oauth2={"cloud_id": cloud_id, "api_token": access_token}
                )
                documents = loader.load_data(
                    JQL_QUERY
                )  # This "should" fetch all issues
                total_documents.extend(documents)
        else:
            loader = JiraReader(
                BasicAuth={
                    "email": self.integration.credentials["email"],
                    "api_token": self.integration.credentials["access_token"],
                    "server_url": self.integration.metadata["site_url"],
                }
            )
            documents = loader.load_data(JQL_QUERY)
            total_documents.extend(documents)

        # Adding the global "source" metadata field
        for document in total_documents:
            document.metadata.pop("labels", None)
            document.metadata["source"] = "Jira"

            # Transform 'created_at' and 'updated_at' to UTC with milliseconds
            created_at = parser.isoparse(document.metadata["created_at"])
            updated_at = parser.isoparse(document.metadata["updated_at"])
            document.metadata["created_at"] = (
                created_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[
                    :-3
                ]
                + "Z"
            )
            document.metadata["updated_at"] = (
                updated_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[
                    :-3
                ]
                + "Z"
            )

        return total_documents
