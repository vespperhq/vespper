---
sidebar_class_name: jira
---

# Jira

This guide shows you how to integrate Merlinn with Jira.

## Overview

Merlinn uses Jira knowledge base in order to shed light on real-time issues in production. It can access tickets, boards, comments and other information that might be relevant to a real production incident.

On the technical side, Merlinn uses the standard Atlassian OAuth flow in order to authenticate with Jira.

**For more information, go to [Atlassian's documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/).**

## Prerequisites

- An existing Merlinn account. If you don't have one, you can [sign up](https://app.merlinn.co/) for free.
- An existing organization. To learn how to create one, check the [quickstart](../02-Quickstart.md) guide.

## Setup

Follow these steps to connect Merlinn to Jira:

1. Inside your organization settings, go to "Integrations".
2. Locate the "Jira" integration and click "Add".
3. Follow the authorization link and go the consent screen.
4. Review the Atlassian's consent screen and click "Accept". After a few moments, you should see "App installed successfully".

That's it! You can go back to Merlinn's dashboard.
