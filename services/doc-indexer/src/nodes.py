import os
from typing import List
from llama_index.core.schema import Document, Node
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.ingestion.transformations import SentenceSplitter


def documents_to_nodes(documents: List[Document], chunk_size: int = 1024) -> List[Node]:
    pipeline = IngestionPipeline(
        transformations=[SentenceSplitter(chunk_size=chunk_size)],
    )
    num_cpus = os.cpu_count()
    num_workers = min(4, num_cpus) if num_cpus > 1 else 1

    nodes = pipeline.run(documents=documents, num_workers=num_workers)
    return nodes
