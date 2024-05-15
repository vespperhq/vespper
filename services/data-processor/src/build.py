import traceback
import nest_asyncio

from db.plan_field import get_plan_field_by_code
from db.plan_state import get_plan_state_by_organization_id, update_plan_state_by_id

nest_asyncio.apply()

from argparse import ArgumentParser
from functools import partial
from bson import ObjectId

from loader import get_documents

import asyncio
from dotenv import load_dotenv, find_dotenv
from llama_index.embeddings.openai import OpenAIEmbedding

load_dotenv(find_dotenv())

import os
from typing import List, Optional
from pinecone import Pinecone, ServerlessSpec
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore

from db import db


def is_index_alive(pc: Pinecone, index_name: str):
    try:
        pc.describe_index(index_name)
        return True
    except Exception:
        return False


async def build_index(
    organization_id: str,
    index_id: ObjectId,
    data_sources: Optional[List[str]] = None,
):
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")

    try:
        index = await db.index.find_one({"_id": index_id})
        index_name = index["name"]
        plan_state = await get_plan_state_by_organization_id(organization_id)

        pc = Pinecone(api_key=pinecone_api_key)

        pc_index_exists = is_index_alive(pc, index_name)
        if pc_index_exists:
            print("Index exists. Delete old one...")
            pc.delete_index(index_name)

        pc.create_index(
            name=index_name,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-west-2"),
        )

        pc_index = pc.Index(name=index_name)

        async def update_status(vendor_name: str, status: str):
            await db.index.update_one(
                {"_id": index_id},
                {"$set": {f"state.integrations.{vendor_name}": status}},
            )

        documents, stats = await get_documents(
            organization_id=organization_id,
            data_sources=data_sources,
            on_progress=partial(update_status, status="in_progress"),
            on_complete=partial(update_status, status="completed"),
        )

        vector_store = PineconeVectorStore(pinecone_index=pc_index)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        embed_model = OpenAIEmbedding(
            api_key=openai_api_key,
            model="text-embedding-3-large",
            dimensions=768,
        )

        VectorStoreIndex(
            documents,
            vector_store=pc_index,
            show_progress=True,
            embed_model=embed_model,
            storage_context=storage_context,
        )

        await db.index.update_one(
            {"_id": index_id},
            {"$set": {"state.status": "completed", "stats": stats}},
        )

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
