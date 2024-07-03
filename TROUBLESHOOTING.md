# Troubleshooting Merlinn

In this document, you can find common scenarios where we're currently have problems. If you're interested in some of these
issues and want to help, feel free to create an [issue](https://github.com/merlinn-co/merlinn/issues).

### `Failed creating a secret`

This errors often happens because the Hashicorp Vault keys in your `.env` are out-dated. This can happen if the `data` folder was changed/deleted. Try to visit the Vault UI at http://localhost:8202 and generate a new set of keys, and update your `.env`.
Once your `.env` is updated, restart your containers using `docker compose up -d`.

### `Sending messages to this app has been turned off`

This is not an error, but a scenario where you cannot send messages to Merlinn. It usually means you didn't enable the messages capability. Go to "App Home" and enable "Messages Tab" and "Allow users to send Slash commands and messages from the messages tab".

More information can be found in the [Slack guide](https://github.com/merlinn-co/merlinn/tree/main/config/slack).

### `An API error occured: invalid_auth`

This error usually happens when the Slack keys (`SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` and/or `SLACK_SIGNING_SECRET`) do not match your actual Slack app. Double-verify your keys are correct by going to your Slack app configuration dashboard.

If they are correct, try to restart the `slackbot` service by running `docker compose up slackbot -d`. Sometimes users update `.env` but do not restart the service itself, which causing it to take out-dated variables.
