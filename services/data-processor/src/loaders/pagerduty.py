from db.types import Integration
import httpx
from llama_index.core import Document

INCIDENT_TEXT_TEMPLATE = """
Incident title: {title}
Incident description: {description}
Incident summary: {summary}
Incident status: {status}
Service name: {service_name}
Created at: {created_at}
"""


async def get_incidents(integration: Integration):
    access_token = integration.credentials.access_token
    integration_type = integration.type
    headers = {}
    if integration_type == "basic":
        headers["Authorization"] = f"Token token={access_token}"
    elif integration_type == "oauth":
        headers["Authorization"] = f"Bearer {access_token}"
    else:
        raise ValueError(f"Invalid integration type: {integration_type}")

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


async def fetch_pagerduty_documents(integration: Integration):
    incidents = await get_incidents(integration)

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
            "id": incident["id"],
            "link": incident["html_url"],
            "status": incident["status"],
            "urgency": incident["urgency"],
            "service_id": service.get("id", "Unknown"),
            "first_trigger_log_entry_id": incident.get(
                "first_trigger_log_entry", {}
            ).get("id", "Unknown"),
            "created_at": incident["created_at"],
        }

        document = Document(doc_id=incident["id"], text=text, metadata=metadata)
        documents.append(document)

    return documents
