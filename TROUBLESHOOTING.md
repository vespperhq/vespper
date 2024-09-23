# Troubleshooting Vespper

In this document, you can find common scenarios where we're currently have problems. If you're interested in some of these
issues and want to help, feel free to create an [issue](https://github.com/vespperhq/vespper/issues).

### `service "X" can't be used with extends as it declare depends_on`

This issue is related to a [new change](https://github.com/docker/compose/issues/11544) the docker compose team has introduced (also mentioned [here](https://github.com/rancher-sandbox/rancher-desktop/issues/6759)).

The solution is to upgrade docker compose to 2.25.0+.

### `Failed creating a secret`

This errors often happens because the Hashicorp Vault keys in your `.env` are out-dated. This can happen if the `data` folder was changed/deleted. Try to visit the Vault UI at http://localhost:8202 and generate a new set of keys, and update your `.env`.
Once your `.env` is updated, restart your containers using `docker compose up -d`.

### `Sending messages to this app has been turned off`

This is not an error, but a scenario where you cannot send messages to Vespper. It usually means you didn't enable the messages capability. Go to "App Home" and enable "Messages Tab" and "Allow users to send Slash commands and messages from the messages tab".

More information can be found in the [Slack guide](https://github.com/vespperhq/vespper/tree/main/config/slack).

### `An API error occured: invalid_auth`

This error usually happens when the Slack keys (`SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` and/or `SLACK_SIGNING_SECRET`) do not match your actual Slack app. Double-verify your keys are correct by going to your Slack app configuration dashboard.

If they are correct, try to restart the `slackbot` service by running `docker compose up slackbot -d`. Sometimes users update `.env` but do not restart the service itself, which causing it to take out-dated variables.

### `429: Too Many Requests`

This error might appear in LiteLLM's logs. It's a bit misleading, and most of the times it means you don't have enough credits left. Go to your LLM provider (OpenAI, Anthropic, etc.) and check your credits.

### Environment variabels are out-dated

If you use VSC Code, sometimes it loads environment variables from the `.env` file automatically. In most cases, it happens because of the python extension. In our `settings.json`, we set `"python.envFile": ""` which shoud prevent that. However, if that doesn't work, try to run the project from a separate terminal (not VS Code).
