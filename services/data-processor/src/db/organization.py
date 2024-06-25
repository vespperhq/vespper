from typing import List
from db import db
from db.types import Integration
from bson import ObjectId


async def get_organization_by_id(id: str) -> List[Integration]:
    organization = await db.organizations.find_one({"_id": ObjectId(id)})
    return organization


async def update_organization_by_id(id: str, data: dict) -> List[Integration]:
    organization = await db.organizations.update_one(
        {"_id": ObjectId(id)}, {"$set": data}
    )
    return organization
