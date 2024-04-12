from db import db


async def get_plan_field_by_code(code: str):
    result = await db.plan_fields.find_one({"code": code})
    return result
