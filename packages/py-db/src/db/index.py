from typing import List
from db.base import BaseModel
from db.db_types import Index
from datetime import datetime
from bson import ObjectId

index_model = BaseModel[Index](collection_name="index", model_class=Index)


async def create_index(
    organization_id: str, data_sources: List[str], type: str
) -> Index:
    current_timestamp = datetime.now()
    initial_state = {
        "status": "pending",
        "integrations": {source: "in_queue" for source in data_sources},
    }
    result = await index_model.create(
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
    return result
