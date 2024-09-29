import os
from functools import lru_cache
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


@lru_cache(maxsize=None)
def init_db(mongo_uri: str = None, db_name: str = "vespper-db"):
    global _client, _db
    if not mongo_uri:
        mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError(
            "MongoDB URI not provided and not found in environment variables"
        )
    _client = AsyncIOMotorClient(mongo_uri)
    _db = _client[db_name]
    return _db


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        return init_db()
    return _db


# ... existing code ...
