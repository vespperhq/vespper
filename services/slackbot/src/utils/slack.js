const { default: axios } = require("axios");

async function getMyId(client) {
  const response = await client.auth.test();
  return response.user_id;
}

async function addReaction(client, channel, timestamp, name) {
  try {
    return await client.reactions.add({
      channel,
      timestamp,
      name,
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
}

async function addFeedbackReactions(client, channel, timestamp) {
  try {
    await Promise.all([
      addReaction(client, channel, timestamp, "thumbsup"),
      addReaction(client, channel, timestamp, "thumbsdown"),
    ]);
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
}

async function openModal(client, trigger_id, view) {
  await client.views.open({
    trigger_id,
    view,
  });
}

async function downloadFile(botToken, url) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${botToken}` },
    };
    const response = await axios.get(url, {
      responseType: "stream",
      headers: config.headers,
    });
    return new Promise((resolve, reject) => {
      const chunks = [];

      response.data.on("data", (chunk) => {
        chunks.push(chunk);
      });

      response.data.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      response.data.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
module.exports = {
  getMyId,
  addReaction,
  addFeedbackReactions,
  openModal,
  downloadFile,
};
