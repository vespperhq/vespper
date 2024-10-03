import os
from typing import List

from db.db_types import Integration
from common.secrets import fetch_secrets


def is_enterprise():
    """
    Returns True if the current environment is an enterprise environment.
    """
    return "VESPPER_CLOUD_REGION" in os.environ


def populate_secrets(integrations: List[Integration]) -> List[Integration]:
    # Collect secret names
    secret_names = []
    for integration in integrations:
        secret_names.extend(integration.credentials.values())
    secrets = fetch_secrets(secret_names)

    populated = []
    for integration in integrations:
        for key, secret_name in integration.credentials.items():
            integration.credentials[key] = secrets[secret_name]
        populated.append(integration)

    return populated
