import os

if os.getenv("OS_ENV") == "linux":
    import pysqlite3  # type: ignore
    import sys

    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")

from dotenv import load_dotenv, find_dotenv
from pydantic import BaseModel
import uvicorn
from db.index import create_index, delete_index_by_id, get_index_by_organization_id
from db.organization import get_organization_by_id
from db.types import Index

load_dotenv(find_dotenv())

from build import build_index

from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException

app = FastAPI()


class BuildIndexRequestData(BaseModel):
    organizationId: str
    dataSources: Optional[List[str]] = None


# Root route
@app.get("/")
async def root():
    return {"message": "Data processor API! 🚀"}


@app.post("/build-index", response_model=Index)
async def start_build_index(
    data: BuildIndexRequestData, background_tasks: BackgroundTasks
):
    organization_id = data.organizationId
    data_sources = data.dataSources

    organization = await get_organization_by_id(organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    # TODO: we re-create the index every time. We need to consider
    # changing this in the future
    existing_index = await get_index_by_organization_id(organization_id)
    if existing_index:
        await delete_index_by_id(existing_index["_id"])

    index = await create_index(organization_id, data_sources, "pinecone")

    background_tasks.add_task(
        build_index,
        organization_id=organization_id,
        index_id=index["_id"],
        data_sources=data_sources,
    )

    return index


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3002))
    reload = os.getenv("RELOAD", "true") == "true"

    uvicorn.run("main:app", port=port, reload=reload, host="0.0.0.0")
