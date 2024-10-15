# Vespper - Open-source AI On-call Developer 🚀

<div align="center">
  <a href="https://vespper.co">
    <img src="./assets/logo-cat.png" alt="Vespper-logo" width="30%" />
  </a>
</div>
<br />
<div align="center">
  <a href="https://docs.vespper.com"><strong>Docs</strong></a> ·
  <a href="https://www.loom.com/share/85dc64d021cc40c4b1064389c20782a6?sid=91b063df-8111-40f0-9ea4-793d5fbe3f6f"><strong>Demo</strong></a> ·
  <a href="https://github.com/vespperhq/vespper/issues"><strong>Report Bug</strong></a> ·
  <a href="https://github.com/orgs/vespper/discussions"><strong>Feature Request</strong></a> ·
  <a href="https://vespper.com/blog"><strong>Blog</strong></a> ·
  <a href="https://join.slack.com/t/vesppercommunity/signup"><strong>Slack</strong></a>
</div>

<br />

<div align="center" style="margin-bottom: 20px">
  <a href="https://vespper.com/?utm_source=github">
    <img src="https://img.shields.io/badge/Website-blue?logo=googlechrome&logoColor=orange" />
  </a>
  <a href="https://calendly.com/dudu-vespper/45-minute-meeting">
    <img src="https://img.shields.io/badge/Book%20a%20Call-blue" />
  </a>
  <a href="https://github.com/vespperhq/vespper/blob/main/LICENSE.md">
    <img src="https://img.shields.io/badge/License-Apache 2.0-red.svg?style=flat-square" alt="Apache 2.0 License" />
  </a>
  <a href="https://github.com/vespperhq/vespper/actions/workflows/ci.yml/badge.svg?branch=main">
    <img src="https://github.com/vespperhq/vespper/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI Status" />
  </a>
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square" alt="Prettier code style" />
  </a>
  <a href="https://join.slack.com/t/vesppercommunity/signup">
    <img src="https://img.shields.io/badge/slack-vespper-E01E5A.svg?logo=slack" alt="Join Slack" />
  </a>
</div>

---

## Overview 💡

**Vespper** is an AI-powered on-call engineer designed to assist developers in real-time with incident detection, root cause analysis (RCA), and insightful support during outages and alerts. 

By leveraging the power of AI and seamless integrations with popular observability tools, Vespper helps developers solve problems faster, reduce stress, and make on-call duty easier.

---

## Why Vespper? 🤔

On-call shifts can be stressful and require swift problem-solving. Traditional troubleshooting often takes time, especially when tracking down the root cause of incidents. **Vespper** was built to simplify this process by:

- **Automating root cause analysis (RCA)** and offering instant, contextual insights.
- Acting as a **24/7 on-call engineer** who jumps in when needed, keeping your team supported at all times.
- Integrating with popular incident management tools, so you can continue using your existing workflows.

## Key Features ✨

- **Automatic Root Cause Analysis (RCA)**: Vespper listens to incidents in real time and performs investigations autonomously.
- **Slack Integration**: Available inside Slack for quick interaction, making the troubleshooting process conversational and simple.
- **Seamless Integrations**: Works with tools like Datadog, Opsgenie, PagerDuty, GitHub, Jira, Notion, and Confluence to gather insights.
- **Developer-friendly UX**: Engages users through intuitive interfaces, enabling engineers to ask follow-up questions and receive real-time feedback.
- **Self-hosting & Security**: You can self-host Vespper, ensuring full control over your data and system.
- **Open-source**: Transparent and community-driven, allowing you to use Vespper freely and contribute to its development.

---

## Getting Started 🚀

Getting Vespper up and running is easy! Below are the steps to get started.

### Prerequisites 📋

Make sure the following are installed on your machine:

- **Docker & Docker Compose**: Install [Docker Desktop](https://docs.docker.com/desktop/) (includes Docker CLI, Docker Engine, and Docker Compose).

### Installation Steps 🛠️

Follow the instructions below or check our [installation video](https://www.loom.com/share/1f562cb067364517b1c1e7bf7f789db7?sid=8ea35183-893e-4e74-b450-c3e2e1cc1f11):

1. **Clone the repository**:

    ```bash
    git clone git@github.com:vespper/vespper.git && cd vespper
    ```

2. **Configure LiteLLM Proxy Server**:

    Vespper uses [LiteLLM Proxy Server](https://docs.litellm.ai/docs/simple_proxy) to interact with LLMs.

    - Copy the example config files:

      ```bash
      cp config/litellm/.env.example config/litellm/.env
      cp config/litellm/config.example.yaml config/litellm/config.yaml
      ```

    - Add your **OpenAI API key** in `config/litellm/.env` as `OPENAI_API_KEY`. You can generate a key [here](https://platform.openai.com/api-keys).

3. **Configure environment variables**:

    ```bash
    cp .env.example .env
    ```

    Open `.env` with a text editor and update the following:

    - `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_SIGNING_SECRET` for Slack integration (check [this guide](https://github.com/vespperhq/vespper/tree/main/config/slack/README.md) to create a Slack app).
    - Optionally, set up `SMTP_CONNECTION_URL` for email invites (using services like SendGrid/Mailgun).

4. **Launch the app**:

    ```bash
    docker-compose up -d
    ```

Visit Vespper's dashboard at `http://localhost:5173` to complete setup. Create a user with the same email as your Slack user to get started.

For more details, visit our [configuration guide](https://docs.vespper.com/Getting%20started/Configure%20&%20connect).

---

## Updating Vespper 🔄

Keep your instance up to date by pulling the latest changes and rebuilding:

```bash
git pull
docker-compose up --build -d
```

---

## Deploying Vespper 🌐

You can deploy Vespper on the cloud. Follow the deployment guides available in our [examples](https://github.com/vespperhq/vespper/tree/main/examples) section.

---

## Visualize Knowledge Base 📊

Vespper uses **ChromaDB** for storing ingested documents and **VectorAdmin** to visualize them. To run VectorAdmin:

```bash
docker-compose up vector-admin -d
```

Access it at `http://localhost:3001` and configure it to connect to ChromaDB.

---

## Troubleshooting & Support 🛠️

If you run into issues:

- Check our [troubleshooting guide](https://github.com/vespperhq/vespper/tree/main/TROUBLESHOOTING.md).
- Reach out via [GitHub Discussions](https://github.com/vespperhq/vespper/discussions).
- Join our community on [Slack](https://join.slack.com/t/vesppercommunity/signup).

---

## Telemetry 📊

By default, Vespper sends basic telemetry via PostHog to help us improve the tool. You can disable telemetry by setting `TELEMETRY_ENABLED=false` in your `.env` file.

Learn more about our data policies in [telemetry docs](https://github.com/vespperhq/vespper/blob/main/services/api/src/telemetry/listener.ts).

---

## License 📜

Vespper is licensed under Apache 2.0. Check out the [LICENSE](https://github.com/vespperhq/vespper/tree/main/LICENSE.md) for more details.

---

## Contributing 🤝

Want to contribute? Check out our [CONTRIBUTING.md](https://github.com/vespperhq/vespper/blob/main/CONTRIBUTING.md) guide for more info on how you can help make Vespper even better!

---

## Contributors ✨

Built with ❤️ by:

- **Dudu** ([GitHub](https://github.com/david1542), [Twitter](https://twitter.com/David))

Lasry17164))
- **Topaz** ([GitHub](https://github.com/topaztee), [Twitter](https://twitter.com/topaz_tee))

--- 

For more information, visit [our website](https://vespper.com).
