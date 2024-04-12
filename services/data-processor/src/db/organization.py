import asyncio
from typing import List
from common.secrets import fetch_secrets
from db import db
from db.types import Integration
from bson import ObjectId


async def get_organization_by_id(id: str) -> List[Integration]:
    organization = await db.organizations.find_one({"_id": ObjectId(id)})
    return organization
