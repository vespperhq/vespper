from typing import List
from db import db
from db.types import Index
from datetime import datetime
from bson import ObjectId


async def get_index_by_organization_id(organization_id: str) -> Index:
    index = await db.index.find_one({"organization": organization_id})
    return index


async def delete_index_by_id(id: str):
    await db.index.delete_one({"_id": id})


async def create_index(
    organization_id: str, data_sources: List[str], type: str
) -> Index:
    current_timestamp = datetime.now()
    initial_state = {
        "status": "pending",
        "integrations": {source: "in_queue" for source in data_sources},
    }
    result = await db.index.insert_one(
        {
            "name": organization_id,
            "organization": ObjectId(organization_id),
            "dataSources": data_sources,
            "type": type,
            "state": initial_state,
            "createdAt": current_timestamp,
            "updatedAt": current_timestamp,
        }
    )
    created = await db.index.find_one({"_id": result.inserted_id})
    return created
