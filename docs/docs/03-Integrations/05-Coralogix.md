---
sidebar_class_name: coralogix
---

# Coralogix

This guide shows you how to integrate Merlinn with Coralogix.

## Overview

Merlinn uses Coralogix to access your production environment's observability data. Merlinn is connected to Coralogix via Coralogix's APIs.

**To learn more about Coralogix APIs, go to the official [docs](https://coralogix.com/docs/coralogix-apis/).**

## Prerequisites

- An existing Merlinn account. If you don't have one, you can [sign up](https://app.merlinn.co/) for free.
- An existing organization. To learn how to create one, check the [quickstart](../02-Quickstart.md) guide.

## Setup

Follow these steps to connect Merlinn to Coralogix:

1. Inside your organization settings, go to "Integrations".
2. Locate the "Coralogix" integration and click "Add".
3. In the modal, insert your API keys. To generate them, go to your Coralogix account dashboard. Then, navigate to Data Flow > API Keys. Locate the "Logs Query API Key" and "Alerts, Rules and Tags API Key".
4. Choose your region.
5. Insert your Coralogix domain URL. This can be found in Settings > Preferences.
6. Click "Connect".
