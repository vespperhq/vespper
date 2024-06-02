import { App } from "@slack/bolt";
import { SCOPES } from "./constants";
import { authorize } from "./utils/install";
import { attachCommands } from "./actions";
import { attachEvents } from "./events";
import { attachMessages } from "./messages";
const port = Number(process.env.PORT || 3000);

// If we're in a local environment, it's preferred to use the socket mode since it works ok.
// https://github.com/slackapi/bolt-js/issues/1151
const envParams =
  process.env.NODE_ENV === "development"
    ? {
        appToken: process.env.APP_TOKEN,
        socketMode: true,
      }
    : {};

const app = new App({
  ...envParams,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  scopes: SCOPES,
  port,
  authorize,
  developerMode: false,
  customRoutes: [
    // This route is served as a health check for the
    // slackbot service in Google Cloud Run
    {
      path: "/",
      method: ["GET"],
      handler: (req, res) => {
        res.writeHead(200);
        res.end(`Slackbot service!`);
      },
    },
  ],
});

attachCommands(app);
attachEvents(app);
attachMessages(app);

init();

async function init() {
  try {
    // Port is defined at the top of this file, in the installerOptions object
    // This is due to SocketModeReceiver not using the port argument
    // https://github.com/slackapi/bolt-js/issues/1179
    await app.start();
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
  } catch (error) {
    console.error("Error starting the Slack Bolt app:", error);
  }
}
