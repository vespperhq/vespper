"""Notion reader."""

from datetime import datetime
import os
from typing import Any, Dict, List, Optional

import requests  # type: ignore
from llama_index.core.readers.base import BasePydanticReader
from llama_index.core.schema import Document

INTEGRATION_TOKEN_NAME = "NOTION_INTEGRATION_TOKEN"
BLOCK_CHILD_URL_TMPL = "https://api.notion.com/v1/blocks/{block_id}/children"
DATABASE_URL_TMPL = "https://api.notion.com/v1/databases/{database_id}/query"
SEARCH_URL = "https://api.notion.com/v1/search"


def utc_to_iso(utc_time: str) -> datetime:
    return datetime.fromisoformat(utc_time.replace("Z", "+00:00"))


# TODO: Notion DB reader coming soon!
class NotionPageReader(BasePydanticReader):
    """Notion Page reader.

    Reads a set of Notion pages.

    Args:
        integration_token (str): Notion integration token.

    """

    is_remote: bool = True
    token: str
    headers: Dict[str, str]

    def __init__(self, integration_token: Optional[str] = None) -> None:
        """Initialize with parameters."""
        if integration_token is None:
            integration_token = os.getenv(INTEGRATION_TOKEN_NAME)
            if integration_token is None:
                raise ValueError(
                    "Must specify `integration_token` or set environment "
                    "variable `NOTION_INTEGRATION_TOKEN`."
                )

        token = integration_token
        headers = {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
        }

        super().__init__(token=token, headers=headers)

    @classmethod
    def class_name(cls) -> str:
        """Get the name identifier of the class."""
        return "NotionPageReader"

    def _read_block(self, block_id: str, num_tabs: int = 0) -> str:
        """Read a block."""
        done = False
        result_lines_arr = []
        cur_block_id = block_id
        most_recent_time = None
        while not done:
            block_url = BLOCK_CHILD_URL_TMPL.format(block_id=cur_block_id)
            query_dict: Dict[str, Any] = {}

            res = requests.request(
                "GET", block_url, headers=self.headers, json=query_dict
            )
            data = res.json()

            for result in data["results"]:
                result_type = result["type"]
                result_obj = result[result_type]

                cur_result_text_arr = []
                if "rich_text" in result_obj:
                    for rich_text in result_obj["rich_text"]:
                        # skip if doesn't have text object
                        if "text" in rich_text:
                            text = rich_text["text"]["content"]
                            prefix = "\t" * num_tabs
                            cur_result_text_arr.append(prefix + text)

                result_block_id = result["id"]
                has_children = result["has_children"]
                if has_children:
                    children_text, _ = self._read_block(
                        result_block_id, num_tabs=num_tabs + 1
                    )
                    cur_result_text_arr.append(children_text)

                cur_result_text = "\n".join(cur_result_text_arr)
                result_lines_arr.append(cur_result_text)
                last_edited_time = result["last_edited_time"]

                if most_recent_time is None or utc_to_iso(
                    last_edited_time
                ) > utc_to_iso(most_recent_time):
                    most_recent_time = last_edited_time

            if data["next_cursor"] is None:
                done = True
                break
            else:
                cur_block_id = data["next_cursor"]

        block_text = "\n".join(result_lines_arr)

        return block_text, most_recent_time

    def read_page(self, page_id: str) -> str:
        """Read a page."""
        return self._read_block(page_id)

    def query_database(
        self, database_id: str, query_dict: Dict[str, Any] = {"page_size": 100}
    ) -> List[str]:
        """Get all the pages from a Notion database."""
        pages = []

        res = requests.post(
            DATABASE_URL_TMPL.format(database_id=database_id),
            headers=self.headers,
            json=query_dict,
        )
        res.raise_for_status()
        data = res.json()

        pages.extend(data.get("results"))

        while data.get("has_more"):
            query_dict["start_cursor"] = data.get("next_cursor")
            res = requests.post(
                DATABASE_URL_TMPL.format(database_id=database_id),
                headers=self.headers,
                json=query_dict,
            )
            res.raise_for_status()
            data = res.json()
            pages.extend(data.get("results"))

        return [page["id"] for page in pages]

    def search(self, query: str) -> List[str]:
        """Search Notion page given a text query."""
        done = False
        next_cursor: Optional[str] = None
        page_ids = []
        while not done:
            query_dict = {
                "query": query,
            }
            if next_cursor is not None:
                query_dict["start_cursor"] = next_cursor
            res = requests.post(SEARCH_URL, headers=self.headers, json=query_dict)
            data = res.json()
            for result in data["results"]:
                page_id = result["id"]
                page_ids.append(page_id)

            if data["next_cursor"] is None:
                done = True
                break
            else:
                next_cursor = data["next_cursor"]
        return page_ids

    def load_data(
        self, page_ids: List[str] = [], database_id: Optional[str] = None
    ) -> List[Document]:
        """Load data from the input directory.

        Args:
            page_ids (List[str]): List of page ids to load.
            database_id (str): Database_id from which to load page ids.

        Returns:
            List[Document]: List of documents.

        """
        if not page_ids and not database_id:
            raise ValueError("Must specify either `page_ids` or `database_id`.")
        docs = []
        if database_id is not None:
            # get all the pages in the database
            page_ids = self.query_database(database_id)
            for page_id in page_ids:
                page_text, most_recent_time = self.read_page(page_id)
                docs.append(
                    Document(
                        text=page_text,
                        id_=page_id,
                        extra_info={"page_id": page_id, "updated_at": most_recent_time},
                    )
                )
        else:
            for page_id in page_ids:
                page_text, most_recent_time = self.read_page(page_id)
                docs.append(
                    Document(
                        text=page_text,
                        id_=page_id,
                        extra_info={"page_id": page_id, "updated_at": most_recent_time},
                    )
                )

        return docs
