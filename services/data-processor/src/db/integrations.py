import asyncio
from typing import List
from common.secrets import fetch_secrets
from db import db
from db.types import Integration
from bson import ObjectId


async def get_integrations_by_organization_id(id: str) -> List[Integration]:
    integrations = await db.integrations.find({"organization": ObjectId(id)}).to_list(
        100
    )
    vendors = await asyncio.gather(
        *[
            db.vendors.find_one({"_id": integration["vendor"]})
            for integration in integrations
        ]
    )

    for i, vendor in enumerate(vendors):
        integrations[i]["vendor"] = vendor

    return [Integration(**integration) for integration in integrations]


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
