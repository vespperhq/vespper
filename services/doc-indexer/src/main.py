import os
from db import init_db

if os.getenv("OS_ENV") == "linux":
    import pysqlite3  # type: ignore
    import sys

    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")

from dotenv import load_dotenv, find_dotenv
from pydantic import BaseModel
import uvicorn
from db.index import index_model
from db.snapshot import snapshot_model
from db.job import job_model
from db.db_types import Index


if os.getenv("IS_DOCKER") != "true":
    load_dotenv(find_dotenv("../../.env"), override=True)
    load_dotenv(find_dotenv(".env.dev"), override=True)

from build import build_index

from fastapi import FastAPI, BackgroundTasks, HTTPException

app = FastAPI()


class BuildIndexRequestData(BaseModel):
    snapshot_id: str
    job_id: str


# Root route
@app.get("/")
async def root():
    return {"message": "Doc Indexer API! 🚀"}


@app.post("/build-index", response_model=Index)
async def start_build_index(
    data: BuildIndexRequestData, background_tasks: BackgroundTasks
):
    snapshot_id = data.snapshot_id
    job_id = data.job_id

    snapshot = await snapshot_model.get_one_by_id(snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    data_sources = list(snapshot.stats.keys())

    job = await job_model.get_one_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    index = await index_model.get_one({"organization": snapshot.organization})
    if not index:
        initial_state = {
            "status": "pending",
            "integrations": {source: "in_queue" for source in data_sources},
        }
        index = await index_model.create(
            {
                "name": str(snapshot.organization),
                "type": "chromadb",
                "organization": snapshot.organization,
                "dataSources": data_sources,
                "state": initial_state,
            }
        )

    background_tasks.add_task(
        build_index,
        snapshot_id=snapshot.id,
        index_id=index.id,
        job_id=job.id,
    )

    return index


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3005))
    reload = os.getenv("RELOAD", "true") == "true"
    mongo_uri = os.getenv("MONGO_URI")

    init_db(mongo_uri)

    uvicorn.run("main:app", port=port, reload=reload, host="0.0.0.0")
