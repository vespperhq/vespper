import requests
from llama_index.readers.jira import JiraReader
from db.types import Integration


def fetch_jira_documents(integration: Integration):
    integration_type = integration.type
    total_documents = []
    if integration_type == "oauth":
        access_token = integration.credentials["access_token"]
        response = requests.get(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        cloud_instances = response.json()
        for cloud_instance in cloud_instances:
            cloud_id = cloud_instance["id"]

            loader = JiraReader(
                Oauth2={"cloud_id": cloud_id, "api_token": access_token}
            )
            documents = loader.load_data(
                "issuetype is not EMPTY"
            )  # This "should" fetch all issues
            total_documents.extend(documents)
    else:
        loader = JiraReader(
            BasicAuth={
                "email": integration.credentials["email"],
                "api_token": integration.credentials["access_token"],
                "server_url": integration.metadata["site_url"],
            }
        )
        documents = loader.load_data("issuetype is not EMPTY")
        total_documents.extend(documents)

    # Adding the global "source" metadata field
    for document in total_documents:
        document.metadata.pop("labels", None)
        document.metadata["source"] = "Jira"

    return documents
