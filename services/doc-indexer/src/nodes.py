import os
from typing import List
from llama_index.core.schema import Document, Node
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.ingestion.transformations import SentenceSplitter


def documents_to_nodes(documents: List[Document], chunk_size: int = 1024) -> List[Node]:
    pipeline = IngestionPipeline(
        transformations=[SentenceSplitter(chunk_size=chunk_size)],
    )
    nodes = pipeline.run(documents=documents)
    return nodes
