from tqdm.auto import tqdm
from github import Github, Auth

# from llama_index.core import SimpleDirectoryReader
from llama_index.readers.github.repository.github_client import GithubClient
from llama_index.readers.github import (
    GitHubIssuesClient,
)
from db.types import Integration
from loaders.raw_readers.github_repo import GithubRepositoryReader
from loaders.raw_readers.github_issues import GitHubRepositoryIssuesReader


def get_repos(token: str):
    auth = Auth.Token(token)
    client = Github(auth=auth)

    repos = []
    for r in client.get_user().get_repos():
        # Ignore forks & archived & non-organizational repos
        if r.fork or r.archived or not r.organization:
            continue
        owner, repo = r.full_name.split("/")
        default_branch = r.default_branch
        latest_commit = r.get_commits()[0]

        repos.append((owner, repo, default_branch, latest_commit.sha))
    return repos


async def fetch_github_documents(
    integration: Integration,
    include_code=True,
    include_issues=True,
):
    token = integration.credentials["access_token"]
    repos = get_repos(token)

    total_documents = []
    for owner, repo, branch, commit_sha in tqdm(
        repos, desc="Reading GitHub repositories"
    ):
        code_documents = []
        issues_documents = []

        # Include code (?)
        if include_code:
            # # TODO: this can crash if the repo is huge, because of Github API Rate limit.
            # # Need to find a way to "wait" maybe or to filter garbage.
            code_client = GithubClient(token, fail_on_http_error=False, verbose=True)
            loader = GithubRepositoryReader(
                github_client=code_client,
                owner=owner,
                repo=repo,
                verbose=True,
            )
            code_documents = await loader.load_data(commit_sha=commit_sha)
            # # Hack, for now
            # loader = SimpleDirectoryReader(
            #     input_dir="/Users/dudulasry/projects/scylladb", recursive=True
            # )
            # code_documents = loader.load_data()
            # Add repo path, commit sha and branch to the documents' metadata
            for document in code_documents:
                document.metadata["repo_path"] = f"{owner}/{repo}"
                document.metadata["commit_sha"] = commit_sha
                document.metadata["branch"] = branch
                document.metadata["doc_type"] = "code_file"

        # Include issues (?)
        if include_issues:
            issues_client = GitHubIssuesClient(github_token=token, verbose=True)
            issues_reader = GitHubRepositoryIssuesReader(
                github_client=issues_client,
                owner=owner,
                repo=repo,
                verbose=True,
            )
            issues_documents = await issues_reader.load_data(
                state=GitHubRepositoryIssuesReader.IssueState.ALL,
            )
            print(f"Found {len(issues_documents)} issues")
            for document in issues_documents:
                document.metadata["repo_path"] = f"{owner}/{repo}"
                document.metadata["doc_type"] = "issue"

        total_documents.extend(code_documents)
        total_documents.extend(issues_documents)

    # Adding the global "source" metadata field
    for document in total_documents:
        document.metadata["source"] = "Github"

    return total_documents
