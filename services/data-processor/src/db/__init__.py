import os
import motor.motor_asyncio

db_uri = os.getenv("MONGO_URI")
client = motor.motor_asyncio.AsyncIOMotorClient(db_uri)
db = client["merlinn-db"]
