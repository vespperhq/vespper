import { App, AppOptions } from "@slack/bolt";
import { SCOPES, isDev, isEnterprise } from "./constants";
import { authorize } from "./utils/install";
import { attachCommands } from "./actions";
import { attachEvents } from "./events";
import { attachMessages } from "./messages";

const port = Number(process.env.PORT || 3000);
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const appToken = process.env.SLACK_APP_TOKEN;
const botToken = process.env.SLACK_BOT_TOKEN;

// If we're in a local environment, it's preferred to use the socket mode since it works ok.
// When hosting in Google Cloud Run, for some reason it behaves weird (delays, slowness, etc).
// In these cases, we don't use socket mode but rather the HTTP mode.
// https://github.com/slackapi/bolt-js/issues/1151
const envParams: Partial<AppOptions> =
  !isEnterprise() || isDev()
    ? {
        token: botToken,
        socketMode: true,
      }
    : {
        authorize,
        customRoutes: [
          // This route is served as a health check endpoint
          {
            path: "/",
            method: ["GET"],
            handler: (req, res) => {
              res.writeHead(200);
              res.end(`Slackbot service!`);
            },
          },
        ],
      };

const app = new App({
  ...envParams,
  appToken,
  signingSecret,
  scopes: SCOPES,
  port,
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
