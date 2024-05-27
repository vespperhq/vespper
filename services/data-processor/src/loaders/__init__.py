from loaders.confluence import fetch_confluence_documents
from loaders.github import fetch_github_documents
from loaders.jira import fetch_jira_documents
from loaders.notion import fetch_notion_documents
from loaders.slack import fetch_slack_documents
from loaders.pagerduty import fetch_pagerduty_documents


loaders = {
    "Slack": fetch_slack_documents,
    "Github": fetch_github_documents,
    "Notion": fetch_notion_documents,
    "Jira": fetch_jira_documents,
    "Confluence": fetch_confluence_documents,
    "PagerDuty": fetch_pagerduty_documents,
}
