import os
from typing import Dict, List

from bson import ObjectId
from storage.base import BaseStorage
from llama_index.core.schema import Document
from constants import SNAPSHOT_STATUSES


async def load_documents(
    storage: BaseStorage,
    snapshot_id: ObjectId,
) -> Dict[str, List[Document]]:

    async def load_document(file_path: str) -> Document:
        json_data = await storage.load(file_path)
        return Document.parse_raw(json_data)

    documents: Dict[str, Dict[str, List[Document]]] = {}
    base_folder = snapshot_id
    for status in SNAPSHOT_STATUSES:
        documents[status] = {}

        vendors = await storage.list(base_folder)
        for vendor in vendors:
            documents[status][vendor] = []
            vendor_folder_path = os.path.join(base_folder, vendor)
            vendor_file_paths = await storage.list(vendor_folder_path)
            for file_path in vendor_file_paths:
                document = await load_document(file_path)
                documents[status][vendor].append(document)

    return documents
