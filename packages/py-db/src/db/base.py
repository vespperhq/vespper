import datetime
from db import get_db
from typing import Any, Dict, List, Type, TypeVar, Generic
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import BaseModel as PydanticBaseModel

T = TypeVar("T", bound=PydanticBaseModel)


def get_current_timestamp():
    return datetime.datetime.now(datetime.timezone.utc)


class BaseModel(Generic[T]):
    def __init__(self, collection_name: str, model_class: Type[T]):
        self.collection_name = collection_name
        self.model_class = model_class

    @property
    def collection(self) -> AsyncIOMotorCollection:
        return get_db()[self.collection_name]

    async def get(self, query: Dict[str, Any] = None, *args, **kwargs) -> List[T]:
        if query is None:
            query = {}
        cursor = self.collection.find(query, *args, **kwargs)
        return [self.model_class(**doc) async for doc in cursor]

    async def get_one(self, query: Dict[str, Any], *args, **kwargs) -> T:
        doc = await self.collection.find_one(query, *args, **kwargs)
        return self.model_class(**doc) if doc else None

    async def get_one_by_id(self, id: str) -> T:
        return await self.get_one({"_id": ObjectId(id)})

    async def get_one_and_update(
        self, query: Dict[str, Any], data: Dict[str, Any], *args, **kwargs
    ) -> T:
        doc = await self.collection.find_one_and_update(
            query,
            {"$set": {**data, "updatedAt": get_current_timestamp()}},
            return_document=True,
            *args,
            **kwargs,
        )
        return self.model_class(**doc) if doc else None

    async def get_one_by_id_and_update(
        self, id: str, data: Dict[str, Any], *args, **kwargs
    ) -> T:
        return await self.get_one_and_update(
            {"_id": ObjectId(id)},
            {**data, "updatedAt": get_current_timestamp()},
            *args,
            **kwargs,
        )

    async def create(self, data: Dict[str, Any], *args, **kwargs) -> T:
        current_timestamp = get_current_timestamp()
        result = await self.collection.insert_one(
            {**data, "updatedAt": current_timestamp, "createdAt": current_timestamp},
            *args,
            **kwargs,
        )
        return await self.get_one_by_id(str(result.inserted_id))

    async def delete_one_by_id(self, id: str, *args, **kwargs) -> bool:
        result = await self.collection.delete_one(
            {"_id": ObjectId(id)}, *args, **kwargs
        )
        return result.deleted_count > 0

    async def delete(self, query: Dict[str, Any], *args, **kwargs) -> bool:
        result = await self.collection.delete_many(query, *args, **kwargs)
        return result.deleted_count
