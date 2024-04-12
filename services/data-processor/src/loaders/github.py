from tqdm.auto import tqdm
from github import Github, Auth
from llama_index.readers.github.repository.github_client import GithubClient

from db.types import Integration
from loaders.raw_readers.github import GithubRepositoryReader


def get_repos(token: str):
    auth = Auth.Token(token)
    client = Github(auth=auth)

    repos = []
    for r in client.get_user().get_repos():
        # Ignore forks & archived & non-organizational repos
        if r.fork or r.archived or not r.organization:
            continue
        default_branch = r.default_branch
        latest_commit = r.get_commits()[0]
        owner, repo = r.full_name.split("/")

        repos.append((owner, repo, default_branch, latest_commit.sha))
    return repos


async def fetch_github_documents(integration: Integration):
    token = integration.credentials["access_token"]
    repos = get_repos(token)
    client = GithubClient(token)

    total_documents = []
    for owner, repo, branch, commit_sha in tqdm(
        repos, desc="Reading GitHub repositories"
    ):
        loader = GithubRepositoryReader(github_client=client, owner=owner, repo=repo)
        documents = await loader.load_data(commit_sha=commit_sha)
        # Add repo path, commit sha and branch to the documents' metadata
        for document in documents:
            document.metadata["repo_path"] = f"{owner}/{repo}"
            document.metadata["commit_sha"] = commit_sha
            document.metadata["branch"] = branch

        total_documents.extend(documents)

    # Adding the global "source" metadata field
    for document in total_documents:
        document.metadata["source"] = "Github"

    return total_documents
