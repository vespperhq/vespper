import traceback
from typing import List
import nest_asyncio
from storage.file import AsyncFileStorage
from llama_index.core.schema import Document

from utils import is_enterprise
from nodes import documents_to_nodes
from db.plan_field import plan_field_model
from db.plan_state import plan_state_model

nest_asyncio.apply()

from argparse import ArgumentParser
from bson import ObjectId

import asyncio
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

import os
from constants import SNAPSHOT_STATUSES
from rag.utils import get_vector_store
from db.snapshot import snapshot_model
from db.job import job_model
from db.index import index_model
from db.plan_state import plan_state_model
from llama_index.core import VectorStoreIndex, StorageContext
from embeddings import LiteLLMEmbedding
from llama_index.embeddings.openai import OpenAIEmbedding

from snapshots.utils import load_documents


def get_embed_model():
    if "LITELLM_URL" in os.environ:
        base_url = os.getenv("LITELLM_URL")
        model_name = "openai/embedding-model"
        return LiteLLMEmbedding(api_base=base_url, model_name=model_name)

    api_key = os.getenv("OPENAI_API_KEY")
    model_name = "text-embedding-3-large"
    return OpenAIEmbedding(api_key=api_key, model=model_name)


async def build_index(
    snapshot_id: ObjectId,
    job_id: ObjectId,
    index_id: ObjectId,
):

    try:
        snapshot = await snapshot_model.get_one_by_id(snapshot_id)
        index = await index_model.get_one_by_id(index_id)
        job = await job_model.get_one_by_id(job_id)

        # Update job status
        new_status = {"metadata": {"phase": "indexing"}}
        await job_model.get_one_by_id_and_update(
            job_id, {"status": {**job.status.model_dump(), **new_status}}
        )

        store = get_vector_store(index.name, index.type)

        if not await store.is_index_live():
            await store.create_index()

        vector_store = store.get_llama_index_store()

        directory = os.getenv("SNAPSHOTS_DIRECTORY")
        if not directory:
            raise ValueError("SNAPSHOTS_DIRECTORY is not set")
        file_store = AsyncFileStorage(directory)

        documents = await load_documents(file_store, str(snapshot_id))
        documents_to_index: List[Document] = []

        total_nodes = []
        stats = {}
        for vendor in documents.keys():
            vendor_documents = documents[vendor]
            n_total_documents = sum(
                [
                    len(status_documents)
                    for status_documents in vendor_documents.values()
                ],
                0,
            )
            print(f"Found total of {n_total_documents} documents for {vendor}")

            for status in ["new", "changed"]:
                documents_to_index.extend(documents[vendor][status])
                nodes = documents_to_nodes(documents[vendor][status])
                total_nodes.extend(nodes)

            n_existing_docs = index.stats and sum(index.stats.values()) or 0
            stats[vendor] = n_existing_docs + len(vendor_documents["new"])

        # Delete nodes of documents that are about to be re-indexed
        if len(documents_to_index) > 0:
            docs_to_delete = list(
                set([document.doc_id for document in documents_to_index])
            )
            vector_store.delete(ref_doc_id=docs_to_delete)

        storage_context = StorageContext.from_defaults(vector_store=vector_store)

        VectorStoreIndex(
            total_nodes,
            vector_store=vector_store,
            show_progress=True,
            embed_model=get_embed_model(),
            storage_context=storage_context,
        )

        await index_model.get_one_by_id_and_update(
            index_id,
            {"state.status": "completed", "stats": stats},
        )

        # If it's an enterprise environment, update the plan state
        if is_enterprise():
            plan_state = await plan_state_model.get_one(
                {"organization": snapshot.organization}
            )
            attemptsField = await plan_field_model.get_one({"code": "indexingAttempts"})
            documentsField = await plan_field_model.get_one(
                {"code": "indexingDocuments"}
            )

            # Increase indexing attempts and set new indexing documents count
            attemptsValue = plan_state.state[str(attemptsField.id)]["value"]
            plan_state.state[str(attemptsField.id)]["value"] = attemptsValue + 1
            plan_state.state[str(documentsField.id)]["value"] = len(documents)
            await plan_state_model.get_one_by_id_and_update(plan_state.id, plan_state)

        print("Build index completed")
    except Exception as e:
        print(e)
        traceback.print_exc()
        await index_model.get_one_by_id_and_update(index_id, {"state.status": "failed"})


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--organization_id", type=str)
    parser.add_argument("--index_id", type=str)
    parser.add_argument("--index_name", type=str)

    args = parser.parse_args()

    asyncio.run(build_index(**vars(args)))
