import { AuthorizeResult } from "@slack/bolt";
import { getIntegration } from "../api/integration";

// This function is responsible for fetching the relevant credentials
// from the database & secrets manager, and returning them to Slack.
// This is necessary for a multiple workspaces setup.
// https://slack.dev/bolt-js/concepts#authorization
// export async function authorize({
//   enterpriseId,
//   teamId,
// }: {
//   enterpriseId?: string;
//   teamId?: string;
// }): Promise<AuthorizeResult> {
//   if (enterpriseId && teamId) {
//     throw new Error("You can only specify either enterpriseId or teamId");
//   }
//   const query = {} as Record<string, string>;
//   if (enterpriseId) {
//     query["metadata.enterprise.id"] = enterpriseId;
//   } else if (teamId) {
//     query["metadata.team.id"] = teamId;
//   }
//   console.log("Fetching credentials for query:", JSON.stringify(query));
//   const integration = (await integrationModel.getOne(
//     query,
//   )) as SlackIntegration;
//   if (!integration) {
//     throw new Error(`No integration found for query: ${JSON.stringify(query)}`);
//   }
//   console.log("Found integration:", JSON.stringify(integration));
//   console.log(
//     "Populating credentials for integration:",
//     JSON.stringify(integration),
//   );
//   const populatedIntegration = (
//     await populateCredentials([integration])
//   )[0] as SlackIntegration;
//   console.log("Populated integration!");

//   return {
//     // You could also set userToken instead
//     botToken: populatedIntegration.credentials.access_token,
//     botId: integration.metadata.bot_id,
//     botUserId: integration.metadata.bot_user_id,
//     teamId: integration.metadata.team.id,
//   };
// }

export async function authorize_api({
  enterpriseId,
  teamId,
}: {
  enterpriseId?: string;
  teamId?: string;
}): Promise<AuthorizeResult> {
  console.log("Authorizing request...");
  if (enterpriseId && teamId) {
    throw new Error("You can only specify either enterpriseId or teamId");
  }
  const query = {} as { teamId?: string; enterpriseId?: string };
  if (enterpriseId) {
    query.enterpriseId = enterpriseId;
  } else if (teamId) {
    query.teamId = teamId;
  }
  console.log("Fetching integration...");
  const integration = await getIntegration(query);
  console.log("Integration fetched!");

  return {
    botToken: integration.credentials.access_token,
    botId: integration.metadata.bot_id,
    botUserId: integration.metadata.bot_user_id,
    teamId: integration.metadata.team.id,
  };
}
