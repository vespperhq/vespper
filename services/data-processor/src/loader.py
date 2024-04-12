import asyncio
from typing import List, Optional
from tqdm.auto import tqdm
from db.integrations import get_integrations_by_organization_id, populate_secrets
from loaders import loaders
from llama_index.core.ingestion import run_transformations
from llama_index.core.settings import (
    Settings,
)


async def get_documents(
    organization_id: str,
    data_sources: Optional[List[str]] = None,
    total_limit: Optional[int] = 10000,
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

    # Calculate the limit per source
    limit_per_source = round(total_limit / len(integrations))

    stats = {}
    documents = []

    # Settings.transformations
    progress_bar = tqdm(integrations)
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
        if asyncio.iscoroutinefunction(loader):
            docs = await loader(integration)
        else:
            docs = loader(integration)

        docs = run_transformations(
            docs,
            Settings.transformations,
        )

        # Limit the number of documents per source
        docs = docs[:limit_per_source]

        documents.extend(docs)
        stats[integration.vendor.name] = len(docs)

        if on_complete:
            await on_complete(vendor_name)

    return documents, stats
