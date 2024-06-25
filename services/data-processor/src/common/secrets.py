import os
from typing import Dict, List
from google.cloud import secretmanager
import hvac


def fetch_secrets(secret_names: List[str]) -> Dict[str, str]:
    if os.getenv("GCLOUD_PROJECT"):
        return fetch_gcp_secrets(secret_names)
    elif (
        os.getenv("HASHICORP_VAULT_URL")
        and os.getenv("HASHICORP_VAULT_ROOT_TOKEN")
        and os.getenv("HASHICORP_VAULT_UNSEAL_TOKEN")
    ):
        return fetch_vault_secrets(secret_names)
    else:
        raise Exception("No secret provider found")


def fetch_gcp_secrets(secret_names: List[str]) -> Dict[str, str]:
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


def fetch_vault_secrets(secret_names: List[str]) -> Dict[str, str]:
    vault_address = os.getenv("HASHICORP_VAULT_URL")
    root_token = os.getenv("HASHICORP_VAULT_ROOT_TOKEN")
    unseal_token = os.getenv("HASHICORP_VAULT_UNSEAL_TOKEN")

    client = hvac.Client(url=vault_address, token=root_token)
    client.sys.submit_unseal_key(unseal_token)

    result = {}
    for secret_name in secret_names:
        try:
            response = client.secrets.kv.v2.read_secret_version(path=secret_name)

            if not response or not response.get("data"):
                raise Exception(f"Could not find secret {secret_name}")

            payload = response["data"]["data"]["value"]
            result[secret_name] = payload
        except Exception as error:
            print(f"Error fetching secret {secret_name}: {error}")

    return result
