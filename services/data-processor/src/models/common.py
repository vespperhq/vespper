from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from typing import Optional


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, *args, **kwargs):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class CommonModel(BaseModel):
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: lambda v: str(v)}
        media_type = "application/json"


class CommonDBModel(CommonModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    createdAt: Optional[datetime]
    updatedAt: Optional[datetime]
