from loaders.confluence import ConfluenceLoader
from loaders.github import GithubLoader
from loaders.jira import JiraLoader
from loaders.notion import NotionLoader
from loaders.slack import SlackLoader
from loaders.pagerduty import PagerDutyLoader


loaders = {
    "Slack": SlackLoader,
    "Github": GithubLoader,
    "Notion": NotionLoader,
    "Jira": JiraLoader,
    "Confluence": ConfluenceLoader,
    "PagerDuty": PagerDutyLoader,
}
