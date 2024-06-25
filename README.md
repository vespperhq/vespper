# Merlinn - open-source AI on-call developer

<div align="center">
    <a href="https://merlinn.co">
      <img src="./assets/logo-wizard.jpg" alt="Merlinn-logo" width="30%"/>
    </a>
</div>
<br />
<div align="center">
   <div>
      <a href="https://docs.merlinn.co"><strong>Docs</strong></a> ·
      <a href="https://www.loom.com/share/85dc64d021cc40c4b1064389c20782a6?sid=91b063df-8111-40f0-9ea4-793d5fbe3f6f"><strong>Demo</strong></a> ·
      <a href="https://github.com/merlinn-co/merlinn/issues"><strong>Report Bug</strong></a> ·
      <a href="https://github.com/orgs/merlinn-co/discussions"><strong>Feature Request</strong></a> ·
      <a href="https://merlinn.co/blog"><strong>Blog</strong></a> ·
      <a href="https://join.slack.com/t/merlinncommunity/signup"><strong>Slack</strong></a> 
   </div>
</div>
<br />
<div style="display: flex" style="margin-bottom: 20px">
<a href="https://merlinn.co/"><img src="https://img.shields.io/badge/Website-blue?logo=googlechrome&logoColor=orange"/></a>
  <a href="https://calendly.com/dudu-merlinn/45-minute-meeting"><img src="https://img.shields.io/badge/Book%20a%20Call-blue" /></a>
<a href="https://github.com/merlinn-co/merlinn/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-GNU AGPLv3-red.svg?style=flat-square" alt="GNU AGPLv3 License"></a>
<a href="https://github.com/merlinn-co/merlinn/actions/workflows/ci.yml/badge.svg?branch=main">
<img src="https://github.com/merlinn-co/merlinn/actions/workflows/ci.yml/badge.svg?branch=main" alt="main-workflow">
</a>
<a href="https://github.com/prettier/prettier">
<img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square" alt="code style: prettier">
</a>
<a href="https://join.slack.com/t/merlinncommunity/signup">
<img src="https://img.shields.io/badge/slack-merlinn-E01E5A.svg?logo=slack" alt="slack-logo" />
</a>
</div>

## Overview 💫

Merlinn is an AI-powered on-call engineer. It can automatically jump into incidents & alerts with you, and provide you useful & contextual insights and RCA in real time.

## Why ❓

Most people don't like to do on-call shifts. It requires engineers to be swift and solve problems quickly. However, it takes time to reach to the root cause of the problem. That's why we developed Merlinn. We believe Gen AI can help on-call developrs solve issues faster.

## Table of Contents

- [Overview](#overview-)
- [Why](#why-)
- [Key Features](#key-features-)
- [Demo](#demo-)
- [Getting started](#getting-started-)
  - [Prerequisites](#prerequisites-)
  - [Quick Installation](#quick-installation-)
  - [Updating Merlinn](#updating-merlinn-️-)
  - [Visualize Knowledge Base](#visualize-knowledge-base-)
- [Support and feedback](#support-and-feedback-️)
- [Telemetry](#telemetry-)
- [License](#license-)
- [Learn more](#learn-more-)
- [Contributors](#contributors-)

## Key features 🎯

- **Automatic RCA**: Merlinn automatically listens to production incidents/alerts and automatically investigates them for you.
- **Slack integration**: Merlinn lives inside your Slack. Simply connect it and enjoy an on-call engineer that never sleeps.
- **Integrations**: Merlinn integrates with popular observability/incident management tools such as Datadog, Coralogix, Opsgenie and Pagerduty. It also integrates to other tools as GitHub, Notion, Jira and Confluence to gain insights on incidents.
- **Intuitive UX**: Merlinn offers a familiar experience. You can talk to it and ask follow-up questions.
- **Secure**: Self-host Merlinn and own your data. Always.
- **Open Source**: We love open-source. Self-host Merlinn and use it for free.

## Demo 🎥

Checkout our [demo video](https://www.loom.com/share/85dc64d021cc40c4b1064389c20782a6?sid=1178d76f-5036-4fb2-887b-63b7f4f9aaac) to see Merlinn in action.

## Getting started 🚀

In order to run Merlinn, you need to clone the repo & run the app using Docker Compose.

### Prerequisites 📜

Ensure you have the following installed:

- **Docker & Docker Compose** - The app works with Docker containers. To run it, you need to have [Docker Desktop](https://docs.docker.com/desktop/), which comes with Docker CLI, Docker Engine and Docker Compose.
<!-- - **Ngrok** - Ngrok allows you to open HTTPS tunnel to your local machine. This is needed in order to get events from PagerDuty/Opsgenie. Install ngrok cli and create an account (see [here](https://ngrok.com/)). -->

### Quick installation 🏎️

You can find the installation video [here](https://www.loom.com/share/1f562cb067364517b1c1e7bf7f789db7?sid=8ea35183-893e-4e74-b450-c3e2e1cc1f11).

1. Clone the repository:

   ```bash
   git clone git@github.com:merlinn-co/merlinn.git && cd merlinn
   ```

2. Copy the .env.example file:

   ```bash
   cp .env.example .env
   ```

3. Launch vault and obtain vault tokens:

   We use Hashicorp Vault to manage secrets such as API tokens, OAuth credentials, etc.

   1. Launch the vault instance:

      ```bash
      docker compose up vault -d
      ```

   2. Go to Vault UI: http://localhost:8202
   3. Insert 1 in "Key shares" and "Key threshold" and click "Initialize".
   4. Click "Download keys".
   5. In the JSON file you've downloaded, copy the first value in "keys_base64" and the "root_token" value. These values are going to be used in the next step as `HASHICORP_VAULT_UNSEAL_TOKEN` and `HASHICORP_VAULT_ROOT_TOKEN` respectively.

4. Open `.env` in your favorite editor (vim, vscode, emacs, etc):

   ```bash
   vim .env # or emacs or vscode or nano
   ```

5. Update these variables:

   - `OPENAI_API_KEY` - Needed in order to use ChatGPT. Obtain your OpenAI API key by creating an account and providing your credit card information here. You can get your API key [here](https://platform.openai.com/api-keys). Rest assured, you won't be charged unless you use the API. For more details on pricing, check [here](https://openai.com/pricing).

   - `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` and `SLACK_SIGNING_SECRET` - These variables are needed in order to talk to Merlinn on Slack. Please follow [this guide](https://github.com/merlinn-co/merlinn/tree/main/config/slack/README.md) to create a new Slack app in your organization.

   - `HASHICORP_VAULT_ROOT_TOKEN` and `HASHICORP_VAULT_UNSEAL_TOKEN` - These variables are used to manage your secrets. You should obtain them from the JSON you've downloaded at step 4. `root_token`=`HASHICORP_VAULT_ROOT_TOKEN`, `keys_base64`=`HASHICORP_VAULT_UNSEAL_TOKEN`

   - (Optional) `SMTP_CONNECTION_URL` - This variable is needed in order to invite new members to your Merlinn organization via email and allow them to use the bot. It's not mandatory if you just want to test Merlinn and play with it. If you do want to send invites to your team members, you can use a service like SendGrid/Mailgun. Should follow this pattern: `smtp://username:password@domain:port`.

6. Launch the project:
   ```bash
   docker compose up -d
   ```

That's it. You should be able to visit Merlinn's dashboard in http://localhost:5173.
Simply create a user **(with the same e-mail as the one in your Slack user)** and start to configure your organization.

The next steps are to configure your organization a bit more (connect incident management tools, build a knowledge base, etc). Head over to the [connect & configure](https://docs.merlinn.co/Getting%20started/Configure%20&%20connect) section in our docs for more information 💫

### Updating Merlinn 🧙‍♂️

1. Pull the latest changes:

   ```bash
   git pull
   ```

2. Rebuild images:

   ```bash
   docker-compose up --build -d
   ```

### Visualize Knowledge Base 🗺️

We use ChromaDB as our vector DB. We also use [vector admin](https://vectoradmin.com/) in order to see the ingested documents. To use vector admin, simply run this command:

```bash
docker compose up vector-admin -d
```

This command starts vector-admin at port 3001. Head over to http://localhost:3001 and configure your local ChromaDB. **Note:** Since vector-admin runs inside a docker container, in the "host" field make sure to insert `http://host.docker.internal:8000` instead of `http://localhost:8000`. This is because "localhost" doesn't refer to the host inside the container itself.

Moreover, in the "API Header & Key", you'd need to put "X-Chroma-Token" as the header and the value you have inside .env `CHROMA_SERVER_AUTHN_CREDENTIALS` as the value.

To learn how to use VectorAdmin, visit the [docs](https://github.com/Mintplex-Labs/vector-admin).

## Support and feedback 👷‍♀️

In order of preference the best way to communicate with us:

- **GitHub Discussions**: Contribute ideas, support requests and report bugs (preferred as there is a static & permanent for other community members).
- **Slack**: community support. Click [here](https://merlinn.co/#community) to join.
- **Privately**: contact at support@merlinn.co

## Telemetry 🔢

By default, Merlinn automatically sends basic usage statistics from self-hosted instances to our server via PostHog.

This allows us to:

- Understand how Merlinn is used so we can improve it.
- Track overall usage for internal purposes and external reporting, such as for fundraising.

Rest assured, the data collected is not shared with third parties and does not include any sensitive information. We aim to be transparent, and you can review the specific data we collect [here](https://github.com/merlinn-co/merlinn/blob/main/services/api/src/telemetry/listener.ts).

If you prefer not to participate, you can easily opt-out by setting `TELEMETRY_ENABLED=false` inside `services/api/.env.dev`.

## License 📃

This project is licensed under the GNU AGPLv3 License - see the [LICENSE](https://github.com/merlinn-co/merlinn/tree/main/LICENSE.md) file for details

## Learn more 🔍

Check out the official website at https://merlinn.co for more information.

## Contributors ✨

Built with ❤️ by Dudu & Topaz

Dudu: [Github](https://github.com/david1542), [Twitter](https://twitter.com/DavidLasry17164)

Topaz: [Github](https://github.com/topaztee), [Twitter](https://twitter.com/topaz_tee)
