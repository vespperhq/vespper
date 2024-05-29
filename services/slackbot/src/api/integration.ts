import axios from "axios";

export async function getIntegration({
  teamId,
  enterpriseId,
}: {
  teamId?: string;
  enterpriseId?: string;
}) {
  const serviceKey = process.env.SLACKBOT_SERVICE_KEY as string;
  const queryString = teamId
    ? `metadata.team.id=${teamId}`
    : `metadata.enterprise.id=${enterpriseId}`;
  const { data } = await axios.get(
    `${process.env.API_BASE_URL}/integrations/slack?${queryString}`,
    {
      headers: {
        "x-slackbot-service-key": serviceKey,
      },
    },
  );
  return data[0];
}
