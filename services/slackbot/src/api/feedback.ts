import axios from "axios";

export async function sendFeedback({
  traceId,
  observationId,
  value,
  email,
  team,
}: {
  traceId: string;
  observationId: string;
  value: number;
  email: string;
  team: string;
}) {
  const response = await axios.post(
    `${process.env.API_URL}/chat/feedback`,
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
    },
  );
  return response.data;
}
