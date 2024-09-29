import asyncio
import json
from datetime import datetime
from typing import Dict, List

from bson import ObjectId
from storage.base import BaseStorage
from llama_index.core.schema import Document


async def store_documents(
    storage: BaseStorage,
    snapshot_id: ObjectId,
    documents: Dict[str, List[Document]],
    data_source: str,
):
    async def store_document(document: Document, status: str):
        file_path = f"{snapshot_id}/{data_source}/{status}/{document.doc_id}.json"
        json_data = document.json()
        await storage.save(json_data.encode(), file_path)

    tasks = []
    for status, docs in documents.items():
        tasks.extend(store_document(doc, status) for doc in docs)

    await asyncio.gather(*tasks)
