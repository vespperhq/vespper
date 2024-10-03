import asyncio
from typing import List

from db.base import BaseModel
from db.vendor import vendor_model
from db.db_types import Integration
from bson import ObjectId

integration_model = BaseModel[Integration](
    collection_name="integrations", model_class=Integration
)


async def get_integrations_by_organization_id(
    organization_id: ObjectId,
) -> List[Integration]:
    integrations = await integration_model.get({"organization": organization_id})

    vendors = await asyncio.gather(
        *[
            vendor_model.get_one_by_id(integration.vendor)
            for integration in integrations
        ]
    )

    for i, vendor in enumerate(vendors):
        integrations[i].vendor = vendor

    return integrations
