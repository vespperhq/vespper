from slack_sdk import WebClient
from db.db_types import Integration

from typing import List
from slack_sdk import WebClient
from loaders.readers.slack import SlackReader

from db.db_types import Integration
from loaders.base import BaseLoader
from llama_index.core.schema import Document


class SlackLoader(BaseLoader):
    def __init__(self, integration: Integration):
        self.name = "SlackLoader"
        self.integration = integration
        self.client = WebClient(token=self.integration.credentials["access_token"])
        super().__init__(self.name, self.integration)

    async def load(self) -> List[Document]:
        # Get most up to date channels
        # TODO: Add pagination to support more than 100 channels
        channels = self.client.conversations_list(
            exclude_archived=True,
            types=["public_channel", "private_channel"],
        )
        channel_ids = [channel["id"] for channel in channels["channels"]]
        id2name = {channel["id"]: channel["name"] for channel in channels["channels"]}

        # Try to join the channels, to avoid "not_in_channel" in Slack.
        self.join_channels(self.client, channel_ids)

        loader = SlackReader(self.integration.credentials["access_token"])
        documents = loader.load_data(channel_ids=channel_ids)

        # Adding the global "source" metadata field
        for document in documents:
            document.metadata["source"] = "Slack"
            document.metadata["channel_name"] = id2name[document.metadata["channel_id"]]
            document.metadata["workspace_url"] = (
                self.integration.metadata.get("workspace_url")
                or self.integration.metadata["incoming_webhook"][
                    "configuration_url"
                ].split("/services")[0]
            )

        return documents

    def join_channels(self, channel_ids: List[str]):
        for channel_id in channel_ids:
            try:
                self.client.conversations_join(channel=channel_id)
            except Exception as e:
                print(e)
                pass
