import axios from "axios";

export async function getIntegration({
  teamId,
  enterpriseId,
}: {
  teamId?: string;
  enterpriseId?: string;
}) {
  // TODO: Currently we don't supply the service key since we moved to open-source
  // and everybody hosts their own slack app.
  const serviceKey = process.env.SLACKBOT_SERVICE_KEY as string;
  const queryString = teamId
    ? `metadata.team.id=${teamId}`
    : `metadata.enterprise.id=${enterpriseId}`;
  const { data } = await axios.get(
    `${process.env.API_URL}/integrations/slack?${queryString}`,
    {
      headers: {
        "x-slackbot-service-key": serviceKey,
      },
    },
  );
  return data[0];
}
