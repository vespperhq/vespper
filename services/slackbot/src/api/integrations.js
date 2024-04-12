const { default: axios } = require("axios");

async function getInstallation(teamId) {
  const response = await axios.get(
    `${process.env.API_BASE_URL}/integrations?teamId=${teamId}`,
    {
      headers: {
        "x-slack-app-token": process.env.APP_TOKEN,
        "x-slack-email": email,
        "x-slack-team": team,
      },
    }
  );
  return response.data;
}

module.exports = { getCompletion };
