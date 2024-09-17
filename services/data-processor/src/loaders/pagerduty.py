from db.types import Integration
from loaders.readers.pagerduty import PagerDutyReader


async def fetch_pagerduty_documents(integration: Integration):
    access_token = integration.credentials["access_token"]
    token_type = integration.type
    loader = PagerDutyReader(access_token, token_type)
    documents = await loader.load_data()

    return documents
