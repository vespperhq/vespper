from typing import Dict, List, Literal, Optional, Union
from pydantic import BaseModel
from db.common import CommonDBModel, PyObjectId


class Vendor(CommonDBModel):
    name: str
    description: str


class Organization(CommonDBModel):
    name: str


class Integration(CommonDBModel):
    vendor: Union[PyObjectId, Vendor]
    type: Optional[Literal["oauth", "basic"]] = None
    organization: Union[PyObjectId, Organization]
    credentials: Optional[dict] = None
    metadata: Optional[dict] = None
    settings: Optional[dict] = None


class User(CommonDBModel):
    oryId: str
    email: str
    status: Literal["activated", "invited"]
    role: Literal["owner", "member"]
    organization: Union[PyObjectId, Organization]


class IndexState(BaseModel):
    status: Literal["pending", "completed", "failed"]
    integrations: Dict


class Index(CommonDBModel):
    organization: Union[PyObjectId, Organization]
    dataSources: List[str]
    name: str
    type: Literal["chromadb", "pinecone"]
    stats: Optional[dict] = None
    state: IndexState


class Snapshot(CommonDBModel):
    stats: Optional[dict] = None
    organization: Union[PyObjectId, Organization]


class Job(CommonDBModel):
    organization: Union[PyObjectId, Organization]
    type: Literal["ingest-knowledge"]
    status: Literal["pending", "completed", "failed"]
    phase: str


class Plan(CommonDBModel):
    name: str
    fields: List[PyObjectId]
    values: dict


class PlanField(CommonDBModel):
    name: str
    code: str
    kind: str
    initialValue: Union[int, bool, str]
    granularity: str
    canExceedLimit: Optional[bool]
    resetMode: Optional[str] = "manual"


class PlanState(CommonDBModel):
    plan: Union[PyObjectId, Plan]
    organization: Union[PyObjectId, Organization]
    state: dict
