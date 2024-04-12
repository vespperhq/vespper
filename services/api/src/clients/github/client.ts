import { Octokit } from "octokit";
// octokit documentation:
// https://docs.github.com/en/rest/orgs/orgs?apiVersion=2022-11-28#list-organizations-for-the-authenticated-user

export class GithubClient {
  token: string;
  octokit: Octokit;

  constructor(token: string) {
    this.token = token;
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getOrgs() {
    const { data } = await this.octokit.request("GET /user/orgs", {
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    return data;
  }

  async getRepos(org: string) {
    const { data } = await this.octokit.request(`GET /orgs/${org}/repos`, {
      org: "ORG",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    return data;
  }

  async getPullRequests({ owner, repo }: { owner: string; repo: string }) {
    const { data } = await this.octokit.request(
      `GET /repos/${owner}/${repo}/pulls?state=closed`,
      {
        owner: "OWNER",
        repo: "REPO",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    return data;
  }

  async getBranch({
    owner,
    repo,
    branch,
  }: {
    owner: string;
    repo: string;
    branch: string;
  }) {
    const result = await this.octokit.rest.repos.getBranch({
      owner: owner,
      repo: repo,
      branch: branch,
    });

    return result;
  }

  async getRepoReadme({ owner, repo }: { owner: string; repo: string }) {
    const { data } = await this.octokit.request(
      `GET /repos/${owner}/${repo}/readme`,
      {
        owner: "OWNER",
        repo: "REPO",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    return data;
  }

  async getMainBranchHeadDiff({
    owner,
    repo,
  }: {
    owner: string;
    repo: string;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let productionBranch: any;

    try {
      productionBranch = await this.getBranch({
        owner,
        repo,
        branch: "master",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.status === 404) {
        productionBranch = await this.getBranch({
          owner,
          repo,
          branch: "main",
        });
      }
    }

    if (!productionBranch) {
      console.error("Could not find production branch");
      return "";
    }

    const latestCommitSha = productionBranch?.data.commit.sha;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await this.octokit.rest.repos.getCommit({
      owner: owner,
      repo: repo,
      ref: latestCommitSha, // Ref parameter can be either a commit SHA or branch name
    });

    const { email } = res.data.commit.author;
    const username = res.data.author.login;

    const combinedPatches = res.data.files.reduce(
      (
        total: string,
        current: {
          patch: string;
          filename: string;
          status: string;
          previous_filename: string;
        },
      ) => {
        const { patch, filename, previous_filename, status } = current;
        if (status === "renamed") {
          total += `File renamed: ${previous_filename} > ${filename}\n\n`;
        } else if (patch) {
          total += `File: ${filename}:\n${patch}\n\n`;
        }
        return total;
      },
      `Author: Username:${username}  Email:${email} \n\n`,
    );

    return combinedPatches;
  }
}
