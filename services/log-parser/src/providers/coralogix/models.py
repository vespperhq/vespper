from typing import List
from pydantic import BaseModel


class CoralogixLogRecord(BaseModel):
    metadata: List[dict[str, str]]
    labels: List[dict[str, str]]
    userData: str


class CoralogixParseLogsRequest(BaseModel):
    logs: str
    severityKey: str
    messageKey: str
