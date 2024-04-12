from slack_sdk import WebClient
from db.types import Integration

from typing import List
from slack_sdk import WebClient

from typing import List

from loaders.raw_readers.slack import SlackReader


def join_channels(client: WebClient, channel_ids: List[str]):
    for channel_id in channel_ids:
        try:
            client.conversations_join(channel=channel_id)
        except Exception as e:
            print(e)
            pass


def fetch_slack_documents(integration: Integration):
    client = WebClient(token=integration.credentials["access_token"])
    # Get most up to date channels
    # TODO: Add pagination to support more than 100 channels
    channels = client.conversations_list(exclude_archived=True, limit=100)
    channel_ids = [channel["id"] for channel in channels["channels"]]

    id2name = {channel["id"]: channel["name"] for channel in channels["channels"]}

    # Try to join the channels, to avoid "not_in_channel" in Slack.
    join_channels(client, channel_ids)

    loader = SlackReader(integration.credentials["access_token"])
    documents = loader.load_data(channel_ids=channel_ids)

    # Adding the global "source" metadata field
    for document in documents:
        document.metadata["source"] = "Slack"
        document.metadata["channel_name"] = id2name[document.metadata["channel_id"]]

    return documents
