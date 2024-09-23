import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import type { GithubIntegration } from "@vespper/db";
import { GithubClient } from "../../../clients";
// import { chatModel } from "../../model";
// import { summarizeReadmePrompt } from "../../prompts";
// import { zip } from "../../../utils/arrays";

export default async function (integration: GithubIntegration) {
  const { access_token } = integration.credentials;

  const githubClient = GithubClient.fromToken(access_token);
  const orgs = await githubClient.getOrgs();
  const repos = (
    await Promise.all(orgs.map((org) => githubClient.getRepos(org.login)))
  )
    .reduce((total, curr) => [...total, ...curr], [])
    .map((repo: { full_name: string }) => repo.full_name);

  // TODO: currently summarizing the readmes of all the repos can become very big,
  // and it exceeds the tool description limit. Need to find a way to circumvent this. For now, I'm commenting it out.

  // const readmes = await Promise.all(
  //   repos.map(async (repoFullName: string) => {
  //     try {
  //       const [owner, repo] = repoFullName.split("/");
  //       const { content } = await githubClient.getRepoReadme({ owner, repo });
  //       const readme = Buffer.from(content, "base64").toString("ascii");
  //       const prompt = await summarizeReadmePrompt.format({ readme, repo });
  //       const { content: summarization } = await chatModel.invoke(prompt);
  //       return summarization;
  //     } catch (e) {
  //       console.log(e);
  //       return "no readme at the moment";
  //     }
  //   }),
  // );

  // const reposInfo = zip(repos, readmes).map(
  //   ([repo, readme]) => `Repo name: ${repo}\nRepo description:${readme}`,
  // );

  return new DynamicStructuredTool({
    name: "get_latest_code_changes",
    description: `Get latest code changes in a repo's main branch, given a repository full name. Available repositories are (in the format of {owner}/{repo}): ${repos.join(
      "\n\n",
    )}`,
    func: async ({ repoFullName }) => {
      try {
        //  get diff of branch
        const [owner, repo] = repoFullName.split("/");

        const diff = await githubClient.getMainBranchHeadDiff({ owner, repo });

        return diff;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error) {
          return error.response?.data;
        }
        return error.message;
      }
    },
    schema: z.object({
      repoFullName: z
        .string()
        .describe("The repo full name in the format of {org}/{repo}"),
    }),
  });
}
