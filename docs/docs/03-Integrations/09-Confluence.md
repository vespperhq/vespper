---
sidebar_class_name: confluence
---

# Confluence

This guide shows you how to integrate Merlinn with Confluence. It is very similar to the [Jira](./08-Jira.md) guide.

## Overview

Merlinn uses Confluence knowledge base in order to access important knowledge that might be relevant for a production issue. It can access your pages, comments, attachments and more.
On the technical side, Merlinn uses the standard Atlassian OAuth flow in order to authenticate with Confluence.

**For more information, go to [Atlassian's documentation](https://developer.atlassian.com/cloud/Confluence/platform/oauth-2-3lo-apps/).**

## Prerequisites

- An existing Merlinn account. If you don't have one, you can [sign up](https://app.merlinn.co/) for free.
- An existing organization. To learn how to create one, check the [quickstart](../02-Quickstart.md) guide.

## Setup

Follow these steps to connect Merlinn to Confluence:

1. Inside your organization settings, go to "Integrations".
2. Locate the "Confluence" integration and click "Add".
3. Follow the authorization link and go the consent screen.
4. Review the Atlassian's consent screen and click "Accept". After a few moments, you should see "App installed successfully".

That's it! You can go back to Merlinn's dashboard.
