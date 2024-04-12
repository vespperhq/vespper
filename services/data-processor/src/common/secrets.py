import os
from typing import Dict, List
from google.cloud import secretmanager


def fetch_secrets(secret_names: List[str]) -> Dict[str, str]:
    project_id = os.getenv("GCLOUD_PROJECT")
    client = secretmanager.SecretManagerServiceClient()

    result = {}
    for secret_name in secret_names:
        secret_path = f"projects/{project_id}/secrets/{secret_name}/versions/latest"

        try:
            version = client.access_secret_version(request={"name": secret_path})

            if not version.payload.data:
                raise Exception(f"Could not find secret {secret_name}")

            payload = version.payload.data.decode("utf-8")
            result[secret_name] = payload
        except Exception as error:
            print(f"Error fetching secret {secret_name}: {error}")

    return result
