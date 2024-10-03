import os
from typing import Dict, List

from bson import ObjectId
from storage.base import BaseStorage
from llama_index.core.schema import Document
from constants import SNAPSHOT_STATUSES


async def load_documents(
    storage: BaseStorage,
    snapshot_id: str,
) -> Dict[str, List[Document]]:

    async def load_document(file_path: str) -> Document:
        json_data = await storage.load(file_path)
        return Document.parse_raw(json_data)

    base_folder = snapshot_id
    vendors = await storage.list(base_folder)
    documents: Dict[str, Dict[str, List[Document]]] = {
        vendor: {status: [] for status in SNAPSHOT_STATUSES} for vendor in vendors
    }

    for vendor in vendors:
        vendor_folder_path = os.path.join(base_folder, vendor)
        statuses = await storage.list(vendor_folder_path)
        for status in statuses:
            status_folder_path = os.path.join(vendor_folder_path, status)
            status_file_paths = await storage.list(status_folder_path)
            for file_path in status_file_paths:
                full_file_path = os.path.join(status_folder_path, file_path)
                document = await load_document(full_file_path)
                documents[vendor][status].append(document)

    return documents
