from collections import namedtuple
import os
import requests
from loaders.readers.confluence import ConfluenceReader
from atlassian import Confluence

from db.types import Integration


def fetch_confluence_documents(integration: Integration):
    integration_type = integration.type
    access_token = integration.credentials["access_token"]

    total_documents = []
    if integration_type == "oauth":
        client_id = os.getenv("ATLASSIAN_CLIENT_ID")
        response = requests.get(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        cloud_instances = response.json()
        for cloud_instance in cloud_instances:
            cloud_id = cloud_instance["id"]
            base_url = f"https://api.atlassian.com/ex/confluence/{cloud_id}"
            token = {"access_token": access_token, "token_type": "bearer"}
            oauth2 = {"client_id": client_id, "token": token}

            # Get all Confluence spaces. Limit is 500 spaces for now
            confluence = Confluence(url=base_url, oauth2=oauth2)
            spaces_response = confluence.get_all_spaces(start=0, limit=500, expand=None)
            spaces = spaces_response["results"]

            for space in spaces:
                loader = ConfluenceReader(base_url=base_url, oauth2=oauth2)
                documents = loader.load_data(
                    space_key=space["key"], page_status="current"
                )
                total_documents.extend(documents)
    else:
        email = integration.credentials["email"]
        site_url = integration.metadata["site_url"]
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
            documents = loader.load_data(space_key=space["key"], page_status="current")
            total_documents.extend(documents)

    # Adding the global "source" metadata field
    for document in total_documents:
        document.metadata["source"] = "Confluence"

    return total_documents
