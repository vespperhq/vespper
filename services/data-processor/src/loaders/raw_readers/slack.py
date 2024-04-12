"""
This is taken from Llama Index repo:
https://github.com/run-llama/llama_index/blob/d1d568a162bd857c20fc7ffd214a21f8b86b58e5/llama-index-legacy/llama_index/legacy/readers/slack.py

The official implementation creates a document per channel, with all the text inside.
This is impractical for large channels, thus we changed it so it creates document per message instead.
"""

from typing import List
from tqdm.auto import tqdm

import logging
import os
import time
from datetime import datetime
from ssl import SSLContext
from typing import Any, List, Optional

from llama_index.core import Document
from llama_index.legacy.bridge.pydantic import PrivateAttr
from llama_index.legacy.readers.base import BasePydanticReader

logger = logging.getLogger(__name__)


class SlackReader(BasePydanticReader):
    """Slack reader.

    Reads conversations from channels. If an earliest_date is provided, an
    optional latest_date can also be provided. If no latest_date is provided,
    we assume the latest date is the current timestamp.

    Args:
        slack_token (Optional[str]): Slack token. If not provided, we
            assume the environment variable `SLACK_BOT_TOKEN` is set.
        ssl (Optional[str]): Custom SSL context. If not provided, it is assumed
            there is already an SSL context available.
        earliest_date (Optional[datetime]): Earliest date from which
            to read conversations. If not provided, we read all messages.
        latest_date (Optional[datetime]): Latest date from which to
            read conversations. If not provided, defaults to current timestamp
            in combination with earliest_date.
    """

    is_remote: bool = True
    slack_token: str
    earliest_date_timestamp: Optional[float]
    latest_date_timestamp: float

    _client: Any = PrivateAttr()

    def __init__(
        self,
        slack_token: Optional[str] = None,
        ssl: Optional[SSLContext] = None,
        earliest_date: Optional[datetime] = None,
        latest_date: Optional[datetime] = None,
        earliest_date_timestamp: Optional[float] = None,
        latest_date_timestamp: Optional[float] = None,
    ) -> None:
        """Initialize with parameters."""
        from slack_sdk import WebClient

        if slack_token is None:
            slack_token = os.environ["SLACK_BOT_TOKEN"]
        if slack_token is None:
            raise ValueError(
                "Must specify `slack_token` or set environment "
                "variable `SLACK_BOT_TOKEN`."
            )
        if ssl is None:
            self._client = WebClient(token=slack_token)
        else:
            self._client = WebClient(token=slack_token, ssl=ssl)
        if latest_date is not None and earliest_date is None:
            raise ValueError(
                "Must specify `earliest_date` if `latest_date` is specified."
            )
        if earliest_date is not None:
            earliest_date_timestamp = earliest_date.timestamp()
        else:
            earliest_date_timestamp = None or earliest_date_timestamp
        if latest_date is not None:
            latest_date_timestamp = latest_date.timestamp()
        else:
            latest_date_timestamp = datetime.now().timestamp() or latest_date_timestamp
        res = self._client.api_test()
        if not res["ok"]:
            raise ValueError(f"Error initializing Slack API: {res['error']}")

        super().__init__(
            slack_token=slack_token,
            earliest_date_timestamp=earliest_date_timestamp,
            latest_date_timestamp=latest_date_timestamp,
        )

    @classmethod
    def class_name(cls) -> str:
        return "SlackReader"

    def _read_message(self, channel_id: str, message_ts: str) -> str:
        from slack_sdk.errors import SlackApiError

        """Read a message."""

        messages_text: List[str] = []
        next_cursor = None
        while True:
            try:
                # https://slack.com/api/conversations.replies
                # List all replies to a message, including the message itself.
                if self.earliest_date_timestamp is None:
                    result = self._client.conversations_replies(
                        channel=channel_id, ts=message_ts, cursor=next_cursor
                    )
                else:
                    conversations_replies_kwargs = {
                        "channel": channel_id,
                        "ts": message_ts,
                        "cursor": next_cursor,
                        "latest": str(self.latest_date_timestamp),
                    }
                    if self.earliest_date_timestamp is not None:
                        conversations_replies_kwargs["oldest"] = str(
                            self.earliest_date_timestamp
                        )
                    result = self._client.conversations_replies(
                        **conversations_replies_kwargs  # type: ignore
                    )
                messages = result["messages"]
                messages_text.extend(message["text"] for message in messages)
                if not result["has_more"]:
                    break

                next_cursor = result["response_metadata"]["next_cursor"]
            except SlackApiError as e:
                if e.response["error"] == "ratelimited":
                    logger.error(
                        "Rate limit error reached, sleeping for: {} seconds".format(
                            e.response.headers["retry-after"]
                        )
                    )
                    time.sleep(int(e.response.headers["retry-after"]))
                else:
                    logger.error(f"Error parsing conversation replies: {e}")
        return "\n\n".join(messages_text)

    def _read_channel(self, channel_id: str, reverse_chronological: bool) -> str:
        from slack_sdk.errors import SlackApiError

        """Read a channel."""

        result_messages: List[str] = []
        next_cursor = None
        while True:
            try:
                # Call the conversations.history method using the WebClient
                # conversations.history returns the first 100 messages by default
                # These results are paginated,
                # see: https://api.slack.com/methods/conversations.history$pagination
                conversations_history_kwargs = {
                    "channel": channel_id,
                    "cursor": next_cursor,
                    "latest": str(self.latest_date_timestamp),
                }
                if self.earliest_date_timestamp is not None:
                    conversations_history_kwargs["oldest"] = str(
                        self.earliest_date_timestamp
                    )
                result = self._client.conversations_history(
                    **conversations_history_kwargs  # type: ignore
                )
                conversation_history = result["messages"]
                # Print results
                logger.info(
                    f"{len(conversation_history)} messages found in {channel_id}"
                )
                result_messages.extend(
                    (
                        {
                            **message,
                            "text": self._read_message(channel_id, message["ts"]),
                        }
                        if message.get("thread_ts")
                        == message["ts"]  # Message is a parent message of a thread
                        else message
                    )
                    for message in tqdm(conversation_history, desc="Reading messages")
                )
                if not result["has_more"]:
                    break
                next_cursor = result["response_metadata"]["next_cursor"]

            except SlackApiError as e:
                if e.response["error"] == "ratelimited":
                    logger.error(
                        "Rate limit error reached, sleeping for: {} seconds".format(
                            e.response.headers["retry-after"]
                        )
                    )
                    time.sleep(int(e.response.headers["retry-after"]))
                else:
                    logger.error(f"Error parsing conversation replies: {e}")

        return result_messages if reverse_chronological else result_messages[::-1]

    def load_data(
        self, channel_ids: List[str], reverse_chronological: bool = True
    ) -> List[Document]:
        """Load data from the input directory.

        Args:
            channel_ids (List[str]): List of channel ids to read.

        Returns:
            List[Document]: List of documents.
        """
        total_documents = []
        for channel_id in tqdm(channel_ids, desc="Reading Slack channels"):
            messages = self._read_channel(
                channel_id, reverse_chronological=reverse_chronological
            )
            # Remove messages with empty text
            messages = [message for message in messages if message["text"] != ""]
            documents = [
                Document(
                    id_=message["ts"],
                    text=message["text"],
                    metadata={"channel_id": channel_id, "ts": message["ts"]},
                )
                for message in messages
            ]
            total_documents.extend(documents)
        return total_documents
