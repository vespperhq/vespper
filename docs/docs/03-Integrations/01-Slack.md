---
sidebar_class_name: slack
---

# Slack

This guide shows you how to integrate Merlinn with Slack.

## Overview

Merlinn uses Slack in order to communicate with your team and help you resolve issues faster. This is the main
Merlinn integration and it is mandatory. Moreover, Merlinn uses its Slack permissions in order to retrieve historical and contextual data in real-time.

On the techical side, Merlinn uses the standard OAuth flow to connect to Slack. For more information, check the [Slack documentation](https://api.slack.com/authentication/oauth-v2).

## Prerequisites

- An existing Merlinn account. If you don't have one, you can [sign up](https://app.merlinn.co/) for free.
- An existing organization. To learn how to create one, check the [quickstart](../02-Quickstart.md) guide.

## Video

Here is a short video that walks through the steps below:

<div style={{ position: 'relative', paddingBottom: '57.50798722044729%', height: 0 }}>
  <iframe
    src="https://www.loom.com/embed/29a289fc38514029a8b34e8aa811fb51?sid=a32d3bc8-ae88-45f1-b620-56ca4cccbb31"
    frameBorder="0"
    allowFullScreen
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    title="Embedded Video"
  ></iframe>
</div>

## Setup

Follow these steps to connect Merlinn to Slack:

1. Inside your organization settings, go to "Integrations".
2. Locate the "Slack" integration and click "Add".
3. Follow the link and authorize Slack. During the authorization screen, you'd be required to select a channel that you want to connect Merlinn to.
4. Once authorized, you should see a text message saying "App installed successfully". You can return to the dashboard.
