import axios from "axios";

export async function getAccessToken() {
  const { data } = await axios.post(
    `https://${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
    {
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
    },
    {
      headers: { "content-type": "application/json" },
    },
  );
  return data.access_token;
}
