import asyncio

from db import db
from bson import ObjectId


async def get_plan_state_by_organization_id(organization_id: str):
    plan_state = await db.plan_states.find_one(
        {"organization": ObjectId(organization_id)}
    )
    return plan_state


async def update_plan_state_by_id(id: str, plan_state: dict):
    result = await db.plan_states.update_one(
        {"_id": ObjectId(id)},
        {"$set": plan_state},
    )
    return result
