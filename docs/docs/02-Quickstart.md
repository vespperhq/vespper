# Quickstart

This guide walks you through the steps of getting Merlinn up and running. Specifically, at the end, you should be able to interact with Merlinn on Slack about your production issues and in general ask it for advice about technical issues.

## Prerequisites

Make sure you have an account. If you don't have one yet, you can [sign up](https://app.merlinn.co/) for free.

## Setup

Once you have an account, follow the following sections.

### Create an organization

Merlinn works in the context of an organization. To get started, you need to create an organization:

1. Go to the dashboard and click "Organization" in the side drawer.
2. Click "Create a new organization".
3. Insert a meaningful name for your organization.
4. Click "Create".

Once created, you should see the organization overview screen:
<img src="./img/doc-imgs/organization-overview.png" />
:::tip
To allow other team members to interact with Merlinn, you need to invite them to your organization. Go to "Members" and click "Invite members"
:::

### Connect Slack

After you create an organization, you need to connect Merlinn to your Slack workspace. To connect Merlinn to your workspace, follow these steps:

1. Inside your organization settings, go to "Integrations".
2. Locate the "Slack" integration and click "Add".
3. Follow the link and authorize Slack. During the authorization screen, you'd be required to select a channel that you want to connect Merlinn to.
4. Once authorized, you should see a text message saying "App installed successfully". You can return to the dashboard.

### Connect other integrations

Merlinn supports several other integrations. To connect other integrations, go to your "Integrations" page and click "Add".

:::info
To learn which integrations are available, check the [Integrations](./03-Integrations/01-Slack.md) section.
:::

### Configure webhooks

Merlinn listens to production alerts/issues and starts investigating automatically. We currently support **PagerDuty** and **Opsgenie**.
To configure webhooks, go to the "Webhooks" inside your organization settings page. There, you can find instructions for each webhook.

The steps usually involves:

1. Generating a secret from the dashboard
2. Adding the secret to the webhook HTTP headers in the corresponding source.

:::info
To learn more about webhooks, check the [Webhooks](./04-Webhooks/01-PagerDuty.md) section.
:::

### Create a knowledge graph

Creating a knowledge graph is a crucial step in the setup process. It allows Merlinn to search contextual
information that might be relevant for the investigation.

Here is a short video that demonstrates how to create a knowledge graph. It usually takes 5-30 minutes (depending on the amount of data) to create a knowledge graph, so we skipped the waiting to show the final result:

<div style={{ position: 'relative', paddingBottom: '57.50798722044729%', height: 0 }}>
    <iframe
    src="https://www.loom.com/embed/8e11837657df42f5b7d6892ac3b80522?sid=90bd74b7-ef38-4fa7-b429-d37b440670a3"
    title="Embedded Video"
    frameBorder="0"
    allowFullScreen
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    ></iframe>
</div>

## Usage

Once everything is set up, you can start using Merlinn. It'd have access to your tools and knowledge graph.

There are several ways to interact with the assistant.

### Private chat

You can send direct messages to Merlinn and have a conversation with it. For example:
<img src="./img/doc-imgs/usage-direct-message.png" style={{width: "50%"}} />

### Incident thread

You can interact with Merlinn in your incidents threads by simply mentioning it with **@Merlinn**. For example:
<img src="./img/doc-imgs/usage-incident-thread.png" style={{width: "50%"}} />
