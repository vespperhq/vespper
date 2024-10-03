import os
from bson import ObjectId

if os.getenv("OS_ENV") == "linux":
    import pysqlite3  # type: ignore
    import sys

    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")

from dotenv import load_dotenv, find_dotenv
from pydantic import BaseModel
import uvicorn
from db import init_db
from db.organization import organization_model
from db.job import job_model
from db.db_types import Job

if os.getenv("IS_DOCKER") != "true":
    load_dotenv(find_dotenv("../../.env"), override=True)
    load_dotenv(find_dotenv(".env.dev"), override=True)

from build import build_snapshot

from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException

app = FastAPI()


class BuildSnapshotRequestData(BaseModel):
    organizationId: str
    dataSources: Optional[List[str]] = None


# Root route
@app.get("/")
async def root():
    return {"message": "Data processor API! 🚀"}


@app.post("/build-snapshot", response_model=Job)
async def start_build_snapshot(
    data: BuildSnapshotRequestData, background_tasks: BackgroundTasks
):
    organization_id = data.organizationId
    data_sources = data.dataSources

    organization = await organization_model.get_one_by_id(organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    job = await job_model.create(
        data={
            "type": "ingest-knowledge",
            "status": "pending",
            "phase": "collecting-documents",
            "organization": ObjectId(organization_id),
        }
    )
    background_tasks.add_task(
        build_snapshot,
        job_id=job.id,
        data_sources=data_sources,
    )

    return job


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3002))
    reload = os.getenv("RELOAD", "true") == "true"
    mongo_uri = os.getenv("MONGO_URI")

    init_db(mongo_uri)

    uvicorn.run("main:app", port=port, reload=reload, host="0.0.0.0")
