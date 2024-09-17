import httpx
from typing import List
from llama_index.core.readers.base import BaseReader
from llama_index.core.schema import Document

INCIDENT_TEXT_TEMPLATE = """
Incident title: {title}
Incident description: {description}
Incident summary: {summary}
Incident status: {status}
Service name: {service_name}
Created at: {created_at}
"""


class PagerDutyReader(BaseReader):
    access_token: str
    token_type: str

    def __init__(self, access_token: str, token_type: str):
        self.access_token = access_token
        self.token_type = token_type

    @classmethod
    def class_name(cls) -> str:
        return "PagerDutyReader"

    async def get_incidents(self) -> List[Document]:
        headers = {}
        if self.token_type == "basic":
            headers["Authorization"] = f"Token token={self.access_token}"
        elif self.token_type == "oauth":
            headers["Authorization"] = f"Bearer {self.access_token}"

        limit = 100
        offset = 0
        resolved_incidents = []
        while True:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.pagerduty.com/incidents",
                    headers=headers,
                    params={
                        "date_range": "all",
                        "statuses[]": "resolved",
                        "limit": limit,
                        "offset": offset,
                    },
                )
                data = response.json()
                incidents = data["incidents"]
                resolved_incidents.extend(incidents)
                if not data["more"]:
                    break
                offset += limit
        return resolved_incidents

    async def load_data(self) -> List[Document]:
        incidents = await self.get_incidents()

        documents = []

        for incident in incidents:
            service = incident.get("service", {})
            service_name = service.get("summary", "Unknown")

            text = INCIDENT_TEXT_TEMPLATE.format(
                title=incident["title"],
                description=incident["description"],
                summary=incident["summary"],
                status=incident["status"],
                service_name=service_name,
                created_at=incident["created_at"],
            )
            metadata = {
                "source": "PagerDuty",
                "title": incident["title"],
                "id": incident["id"],
                "link": incident["html_url"],
                "status": incident["status"],
                "urgency": incident["urgency"],
                "service_id": service.get("id", "Unknown"),
                "first_trigger_log_entry_id": incident.get(
                    "first_trigger_log_entry", {}
                ).get("id", "Unknown"),
                "created_at": incident["created_at"],
                "updated_at": incident["updated_at"],
            }

            document = Document(doc_id=incident["id"], text=text, metadata=metadata)
            documents.append(document)

        return documents
