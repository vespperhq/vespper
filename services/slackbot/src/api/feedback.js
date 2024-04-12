const { default: axios } = require("axios");

async function sendFeedback({ traceId, observationId, value, email, team }) {
  const response = await axios.post(
    `${process.env.API_BASE_URL}/chat/feedback`,
    {
      traceId,
      observationId,
      value,
    },
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

module.exports = { sendFeedback };
