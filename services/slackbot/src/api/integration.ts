import axios from "axios";
import { getAccessToken } from "./auth0";

export async function getIntegration({
  teamId,
  enterpriseId,
}: {
  teamId?: string;
  enterpriseId?: string;
}) {
  const token = await getAccessToken();
  const queryString = teamId
    ? `metadata.team.id=${teamId}`
    : `metadata.enterprise.id=${enterpriseId}`;
  const { data } = await axios.get(
    `${process.env.API_BASE_URL}/integrations?${queryString}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return data[0];
}
