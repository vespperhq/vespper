import json
import os
from typing import List, Optional
from dateutil import parser
from utils import populate_secrets
from tqdm.auto import tqdm
from db.db_types import Snapshot
from db.integration import get_integrations_by_organization_id
from db.snapshot import snapshot_model, get_previous_snapshot
from loaders import loaders
from storage.base import BaseStorage
from storage.file import AsyncFileStorage
from snapshots.utils import store_documents
from bson import ObjectId
from llama_index.core.schema import Document


async def filter_unchanged_documents(
    storage: BaseStorage,
    documents: List[Document],
    data_source: str,
    previous_snapshot: Snapshot,
):
    documents_path = f"{previous_snapshot.id}/{data_source}"

    # Get all JSON files from new, changed, and unchanged folders
    total_file_paths = []
    for status in ["new", "changed", "unchanged"]:
        folder_path = os.path.join(documents_path, status)
        if await storage.exists(folder_path):
            file_paths = await storage.list(folder_path)
            total_file_paths.extend(
                [
                    os.path.join(folder_path, f)
                    for f in file_paths
                    if f.endswith(".json")
                ]
            )

    if len(total_file_paths) == 0:
        return [], [], documents

    new_documents = []
    unchanged_documents = []
    changed_documents = []

    for document in documents:
        # At the moment, if the document doesn't have an updated_at, we re-index it
        if not document.metadata.get("updated_at"):
            changed_documents.append(document)
            continue

        document_id = document.doc_id
        previous_document_path = next(
            (path for path in total_file_paths if path.endswith(f"{document_id}.json")),
            None,
        )

        if previous_document_path:
            content = await storage.load(previous_document_path)
            data = json.loads(content)

            previous_document = Document.from_dict(data)

            document_timestamp = parser.isoparse(document.metadata["updated_at"])
            node_timestamp = parser.isoparse(previous_document.metadata["updated_at"])

            # If the document's updated_at date is greater than the node's updated_at date, it means
            # the document has been updated, so we need to re-index it
            if document_timestamp > node_timestamp:
                changed_documents.append(document)
            else:
                unchanged_documents.append(document)
        else:
            new_documents.append(document)

    print(f"Found {len(changed_documents)} changed documents")
    print(f"Found {len(unchanged_documents)} unchanged documents")
    print(f"Found {len(new_documents)} new documents")

    return changed_documents, unchanged_documents, new_documents


async def get_documents(
    organization_id: ObjectId,
    snapshot_id: ObjectId,
    data_sources: Optional[List[str]] = None,
    on_progress: Optional[callable] = None,
    on_complete: Optional[callable] = None,
):
    integrations = await get_integrations_by_organization_id(
        organization_id,
    )
    if data_sources:
        integrations = [
            integration
            for integration in integrations
            if integration.vendor.name in data_sources
        ]
    integrations = populate_secrets(integrations)
    vendor_names = [integration.vendor.name for integration in integrations]
    print(f"Found {len(integrations)} integrations: {vendor_names}")

    stats = {}

    progress_bar = tqdm(integrations)

    snapshot = await snapshot_model.get_one_by_id(snapshot_id)
    directory = os.getenv("SNAPSHOTS_DIRECTORY")
    if not directory:
        raise ValueError("SNAPSHOTS_DIRECTORY is not set")

    storage = AsyncFileStorage(directory)

    for integration in progress_bar:
        vendor_name = integration.vendor.name
        if on_progress:
            await on_progress(vendor_name)

        progress_bar.set_description(f"Processing {vendor_name}")
        loader_cls = loaders.get(vendor_name)
        if not loader_cls:
            print(f"No loader found for {vendor_name}")
            continue

        try:
            loader = loader_cls(integration)

            raw_docs = await loader.load()
            previous_snapshot = await get_previous_snapshot(snapshot_id)

            changed_documents = []
            unchanged_documents = []
            new_documents = []

            if not previous_snapshot:
                # If no previous snapshot, we assume all documents are new
                new_documents = raw_docs
            else:
                # If there is a previous snapshot, we check what has changed
                changed_documents, unchanged_documents, new_documents = (
                    await filter_unchanged_documents(
                        storage=storage,
                        documents=raw_docs,
                        data_source=vendor_name,
                        previous_snapshot=previous_snapshot,
                    )
                )

            documents = {
                "new": new_documents,
                "changed": changed_documents,
                "unchanged": unchanged_documents,
            }
            await store_documents(storage, snapshot.id, documents, vendor_name)
            stats[integration.vendor.name] = {
                status: len(docs) for status, docs in documents.items()
            }
        except Exception as e:
            print(f"Could not load {vendor_name}. Error: {e}")
            continue

        if on_complete:
            await on_complete(vendor_name)

    return stats
