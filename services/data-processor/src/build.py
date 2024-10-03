import os
import traceback
import httpx
import nest_asyncio

nest_asyncio.apply()

from argparse import ArgumentParser
from functools import partial
from bson import ObjectId

import asyncio
from loader import get_documents
from db.job import job_model
from db.snapshot import snapshot_model
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

from typing import List, Optional


async def build_snapshot(
    job_id: ObjectId,
    data_sources: Optional[List[str]] = None,
):
    try:

        async def update_status(vendor_name: str, status: str):
            print(f"Updating status for {vendor_name} to {status}")

        job = await job_model.get_one_by_id(job_id)
        snapshot = await snapshot_model.create(data={"organization": job.organization})

        stats = await get_documents(
            organization_id=job.organization,
            snapshot_id=snapshot.id,
            data_sources=data_sources,
            on_progress=partial(update_status, status="in_progress"),
            on_complete=partial(update_status, status="completed"),
        )

        await snapshot_model.get_one_by_id_and_update(
            snapshot.id, data={"stats": stats}
        )

        # Notify the doc indexer service by sending HTTP request (POST)
        # to /build-index
        DOC_INDEXER_URL = os.getenv("DOC_INDEXER_URL")
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{DOC_INDEXER_URL}/build-index",
                json={"snapshot_id": str(snapshot.id), "job_id": str(job.id)},
            )

        print(f"Updated snapshot {str(snapshot.id)} with stats")
        print("Build snapshot completed")
    except Exception as e:
        print(e)
        traceback.print_exc()
        await snapshot_model.get_one_by_id_and_update(
            snapshot.id, data={"state.status": "failed"}
        )


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--organization_id", type=str)
    parser.add_argument("--snapshot_id", type=str)

    args = parser.parse_args()

    asyncio.run(build_snapshot(**vars(args)))
