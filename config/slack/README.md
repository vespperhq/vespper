# Merlinn - Slack Bot setup

<div align="center">
    <img src="../../assets/slack-logo.png" alt="Slack-logo" width="15%"/>
</div>

## Overview

In this tutorial, you'll learn how to setup your Merlinn Slack Bot.

At the end, you should have a new Slack app in your workspace with the 3 tokens needed: `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN` and `SLACK_BOT_TOKEN`.

## Prerequisites

- Clone the Merlinn repository
- Have a Slack workspace where you want to install the Slackbot

## Setup

### Create a New Slack App

1. Go to [api.slack.com](https://api.slack.com) and create a new app.
2. Click "your apps" and then select "Create New App"
3. Select "From an app manifest" and choose the workspace where you want to use the Slackbot.
4. Copy the contents of `config/slack/manifest.yaml` from the Merlinn repository and paste it into the app manifest field.
5. Click “Create” to create the app.
6. Click "Install to workspace".

Once the app is installed, continue to the next section where you'll extract some key variables and configure some settings.

### Configure the Slack app

In this section, you will configure some more things and extract these 3 variables: `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN` and `SLACK_BOT_TOKEN`. They are needed in order for Merlinn's services to interact with your workspace.

1. In the "Basic Information" page, copy the “Signing Secret” from the Slack app settings and paste it into the .env file as `SLACK_SIGNING_SECRET`.
2. In the same page "Basic Information", go to "App-Level Tokens" and click "Generate Token and Scopes". Give it a meaningful name (e.g merlinn-token) and grant it 2 scopes: `connections:write` and `authorizations:read`. Copy the token and put it in the main `.env` as `SLACK_APP_TOKEN`.
3. In the "OAuth & Permissions", copy the “Bot User OAuth Token” and put it in the main `.env` as `SLACK_BOT_TOKEN`.
4. Go to "App Home" and enable "Messages Tab" and "Allow users to send Slash commands and messages from the messages tab".

### **(Optional)** Customize the Slack app

1. You can change the name and background color of the Slackbot in the Slack app settings.
2. You can use Merlinn's logo as your app's logo. View the logo [here](https://storage.googleapis.com/merlinn-assets/brand/logo-wizard-full.jpg).

### Test the Slack app

To test the app, you should launch the slackbot & project. Go back to the [readme](https://github.com/merlinn-co/merlinn?tab=readme-ov-file#quick-installation-%EF%B8%8F) and go to step 6 ("launch the project").

After you launch it, follow these steps to test the Slack app:

1. Go to your Slack workspace and go to Merlinn's direct messages.
2. Write `/merlinn help` in the message bar.

Now you should see the help message of the bot! 🥳
This means the basic functionality works.

## Next Steps

If you were redirected to this guide from the main README.md, please continue to setup your environment [there](https://github.com/merlinn-co/merlinn?tab=readme-ov-file#quick-installation-%EF%B8%8F).

Also, you can visit our [docs](https://docs.merlinn.co/) for more information.
