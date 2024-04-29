from db.types import Integration
from notion_client import Client
from llama_index.readers.notion import NotionPageReader


def fetch_notion_documents(integration: Integration):
    client = Client(auth=integration.credentials["access_token"])
    response = client.search(filter={"value": "page", "property": "object"})
    pages = response["results"]
    page_ids = [page["id"] for page in pages]

    loader = NotionPageReader(integration.credentials["access_token"])
    documents = loader.load_data(page_ids=page_ids)

    # Adding the global "source" metadata field
    for document in documents:
        document.metadata["source"] = "Notion"
        document.metadata["workspace_id"] = integration.metadata["workspace_id"]
        document.metadata["workspace_name"] = integration.metadata["workspace_name"]

    return documents
