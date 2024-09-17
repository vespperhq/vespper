import traceback
import nest_asyncio

from utils import is_enterprise
from db.plan_field import get_plan_field_by_code
from db.plan_state import get_plan_state_by_organization_id, update_plan_state_by_id

nest_asyncio.apply()

from argparse import ArgumentParser
from functools import partial
from bson import ObjectId

from loader import get_documents

import asyncio
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

import os
from typing import List, Optional
from rag.utils import get_vector_store
from llama_index.core import VectorStoreIndex, StorageContext
from embeddings import LiteLLMEmbedding

from db import db


async def build_index(
    organization_id: str,
    index_id: ObjectId,
    data_sources: Optional[List[str]] = None,
):
    litellm_url = os.getenv("LITELLM_URL")

    try:
        index = await db.index.find_one({"_id": index_id})
        index_name = index["name"]
        index_type = index["type"]
        plan_state = await get_plan_state_by_organization_id(organization_id)

        store = get_vector_store(index_name, index_type)

        if not await store.is_index_live():
            await store.create_index()

        async def update_status(vendor_name: str, status: str):
            await db.index.update_one(
                {"_id": index_id},
                {"$set": {f"state.integrations.{vendor_name}": status}},
            )

        vector_store = store.get_llama_index_store()
        documents, stats = await get_documents(
            index=index,
            vector_store=vector_store,
            organization_id=organization_id,
            data_sources=data_sources,
            on_progress=partial(update_status, status="in_progress"),
            on_complete=partial(update_status, status="completed"),
        )
        # Delete nodes of documents that are about to be re-indexed
        if len(documents) > 0:
            docs_to_delete = list(set([document.ref_doc_id for document in documents]))
            vector_store.delete(ref_doc_id=docs_to_delete)

        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        embed_model = LiteLLMEmbedding(
            api_base=litellm_url,
            model_name="openai/embedding-model",
        )

        VectorStoreIndex(
            documents,
            vector_store=vector_store,
            show_progress=True,
            embed_model=embed_model,
            storage_context=storage_context,
        )

        await db.index.update_one(
            {"_id": index_id},
            {"$set": {"state.status": "completed", "stats": stats}},
        )

        # If it's an enterprise environment, update the plan state
        if is_enterprise():
            attemptsField = await get_plan_field_by_code("indexingAttempts")
            documentsField = await get_plan_field_by_code("indexingDocuments")

            # Increase indexing attempts and set new indexing documents count
            attemptsValue = plan_state["state"][str(attemptsField["_id"])]["value"]
            plan_state["state"][str(attemptsField["_id"])]["value"] = attemptsValue + 1
            plan_state["state"][str(documentsField["_id"])]["value"] = len(documents)
            await update_plan_state_by_id(plan_state["_id"], plan_state)

        print("Build index completed")
    except Exception as e:
        print(e)
        traceback.print_exc()
        await db.index.update_one(
            {"_id": index_id}, {"$set": {"state.status": "failed"}}
        )


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--organization_id", type=str)
    parser.add_argument("--index_id", type=str)
    parser.add_argument("--index_name", type=str)

    args = parser.parse_args()

    asyncio.run(build_index(**vars(args)))
