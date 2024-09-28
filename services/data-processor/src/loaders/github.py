from typing import List
from tqdm.auto import tqdm
from github import Github, Auth, GithubException

# from llama_index.core import SimpleDirectoryReader
from loaders.utils.github_client import GithubClient
from llama_index.readers.github import (
    GitHubIssuesClient,
)
from db.types import Integration
from loaders.readers.github_repo import GithubRepositoryReader
from loaders.readers.github_issues import GitHubRepositoryIssuesReader

from db.types import Integration
from loaders.base import BaseLoader
from llama_index.core.schema import Document


class GithubLoader(BaseLoader):
    def __init__(self, integration: Integration):
        self.name = "GithubLoader"

        self.integration = integration
        self.include_code = True
        self.include_issues = True
        # self.excluded_files = ["package-lock.json", "yarn.lock", "poetry.lock"]
        super().__init__(self.name, self.integration)

    def get_repos(self):
        token = self.integration.credentials["access_token"]
        settings = self.integration.settings

        repos_to_sync = None
        if settings:
            repos_to_sync = settings.get("reposToSync")
            repos_to_sync = repos_to_sync.split(",") if repos_to_sync else None

        auth = Auth.Token(token)
        client = Github(auth=auth)

        repos_list = client.get_user().get_repos()
        repos_to_ingest = []
        for r in repos_list:
            # Skip repos that are not in the list of repos to sync
            if repos_to_sync and r.full_name not in repos_to_sync:
                continue
            # Ignore archived repos
            if r.archived:
                continue
            owner, repo = r.full_name.split("/")
            default_branch = r.default_branch

            try:
                latest_commit = r.get_commits()[0]
            except GithubException as e:
                print(f"Error fetching commits for {r.full_name}. Error: {e}")
                continue

            repos_to_ingest.append((owner, repo, default_branch, latest_commit.sha))
        return repos_to_ingest

    async def load(self) -> List[Document]:
        token = self.integration.credentials["access_token"]

        repos = self.get_repos()
        if len(repos) == 0:
            print("No repositories found. Skipping Github ingestion.")
            return []

        total_documents = []
        for owner, repo, branch, commit_sha in tqdm(
            repos, desc="Reading GitHub repositories"
        ):
            code_documents = []
            issues_documents = []

            # Include code (?)
            if self.include_code:
                # # TODO: this can crash if the repo is huge, because of Github API Rate limit.
                # # Need to find a way to "wait" maybe or to filter garbage.
                code_client = GithubClient(
                    token, fail_on_http_error=False, verbose=True
                )

                # TODO: updated_at timestamp doesn't seem to work (our code treats same docs as new)
                loader = GithubRepositoryReader(
                    github_client=code_client,
                    owner=owner,
                    repo=repo,
                    verbose=True,
                    # filter_files=(
                    #     EXCLUDED_FILES,
                    #     GithubRepositoryReader.FilterType.EXCLUDE,
                    # ),
                )
                code_documents = await loader.load_data(commit_sha=commit_sha)
                # Add repo path, commit sha and branch to the documents' metadata
                for document in code_documents:
                    document.metadata["repo_path"] = f"{owner}/{repo}"
                    document.metadata["commit_sha"] = commit_sha
                    document.metadata["branch"] = branch
                    document.metadata["doc_type"] = "code_file"

            # Include issues (?)
            if self.include_issues:
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
                    document.metadata["labels"] = ",".join(
                        document.metadata.get("labels")
                    )

            total_documents.extend(code_documents)
            total_documents.extend(issues_documents)

        # Adding the global "source" metadata field
        for document in total_documents:
            document.metadata["source"] = "Github"

        return total_documents
