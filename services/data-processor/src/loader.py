import os
import asyncio
from typing import List, Optional, Any
from dateutil import parser
import numpy as np
from tqdm.auto import tqdm
from db.integrations import get_integrations_by_organization_id, populate_secrets
from loaders import loaders
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.settings import (
    Settings,
)

from llama_index.core.schema import Document
from llama_index.core.vector_stores.types import (
    BasePydanticVectorStore,
    VectorStoreQuery,
    MetadataFilters,
    MetadataFilter,
    FilterOperator,
)


async def filter_unchanged_documents(
    vector_store: BasePydanticVectorStore,
    documents: List[Document],
):
    # Create a dictionary to group documents by ref_doc_id
    document_ids = [document.doc_id for document in documents]

    result = vector_store.query(
        VectorStoreQuery(
            similarity_top_k=100000000000,  # TODO: This is a hack to make sure we get all the documents
            filters=MetadataFilters(
                filters=[
                    MetadataFilter(
                        key="ref_doc_id",
                        value=document_ids,
                        operator=FilterOperator.IN,
                    )
                ]
            ),
        )
    )
    db_nodes = result.nodes
    if len(db_nodes) == 0:
        return [], [], documents

    db_nodes_groups = {}
    for db_node in db_nodes:
        ref_doc_id = db_node.ref_doc_id
        if ref_doc_id not in db_nodes_groups:
            db_nodes_groups[ref_doc_id] = []
        db_nodes_groups[ref_doc_id].append(db_node)

    new_documents = []
    unchanged_documents = []
    changed_documents = []

    for document in documents:
        # At the moment, if the document doesn't have an updated_at, we re-index it
        if not document.metadata.get("updated_at"):
            changed_documents.append(document)
            continue

        document_id = document.doc_id
        document_nodes = db_nodes_groups.get(document_id, [])
        if len(document_nodes) > 0:
            document_timestamp = parser.isoparse(document.metadata["updated_at"])
            node_timestamp = parser.isoparse(document_nodes[0].metadata["updated_at"])

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
    index: Any,
    vector_store: BasePydanticVectorStore,
    organization_id: str,
    data_sources: Optional[List[str]] = None,
    total_limit: Optional[int] = 10000,  # unused at the moment
    on_progress: Optional[callable] = None,
    on_complete: Optional[callable] = None,
):
    integrations = await get_integrations_by_organization_id(organization_id)
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
    total_nodes = []
    progress_bar = tqdm(integrations)
    n_existing_nodes = index.get("stats") and sum(index["stats"].values()) or 0

    for integration in progress_bar:
        vendor_name = integration.vendor.name
        if on_progress:
            await on_progress(vendor_name)

        progress_bar.set_description(f"Processing {vendor_name}")
        loader = loaders.get(vendor_name)
        if not loader:
            print(f"No loader found for {vendor_name}")
            continue

        # Loader might be an async code, so we need to await it
        try:
            if asyncio.iscoroutinefunction(loader):
                raw_docs = await loader(integration)
            else:
                raw_docs = loader(integration)

            changed_documents, unchanged_documents, new_documents = (
                await filter_unchanged_documents(vector_store, raw_docs)
            )
        except Exception as e:
            print(f"Could not load {vendor_name}. Error: {e}")
            continue

        progress_bar.set_description(f"Transforming {vendor_name}")
        pipeline = IngestionPipeline(
            transformations=[SentenceSplitter(chunk_size=1024)],
        )
        num_cpus = os.cpu_count()
        num_workers = min(4, num_cpus) if num_cpus > 1 else 1

        new_nodes = pipeline.run(documents=new_documents, num_workers=num_workers)
        changed_nodes = pipeline.run(
            documents=changed_documents, num_workers=num_workers
        )
        nodes = new_nodes + changed_nodes

        print(f"Found total of {len(raw_docs)} documents for {vendor_name}")
        total_nodes.extend(nodes)
        stats[integration.vendor.name] = n_existing_nodes + len(new_nodes)

        if on_complete:
            await on_complete(vendor_name)

    return total_nodes, stats
