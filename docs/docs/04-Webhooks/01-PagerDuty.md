---
sidebar_class_name: pagerduty
---

# PagerDuty

This guide shows you how to create a webhook to Merlinn in your PagerDuty account.

## Overview

Merlinn uses PagerDuty Generic Webhooks V3 in order to be notified when incidents/alerts happen. Once an incident happens, PagerDuty will send a webhook to your Merlinn account, kicking off the investigation.

For more information about PagerDuty webhooks, checkout the official [documentation](https://developer.pagerduty.com/docs/db0fa8c8984fc-overview).

## Prerequisites

- An existing Merlinn account. If you don't have one, you can [sign up](https://app.merlinn.co/) for free.
- An existing organization. To learn how to create one, check the [quickstart](../02-Quickstart.md) guide.
- A configured PagerDuty OAuth integration. To learn how to create one, check the [PagerDuty integration guide](../03-Integrations/02-PagerDuty.md).

## Setup

Follow these steps to connect Merlinn to PagerDuty:

1. Inside your organization settings, go to "Webhooks".
2. Locate the "PagerDuty" integration and click "Add".
3. In the modal, click "Generate" to generate a new secret and copy it.

Once you've obtained your secret, go to your PagerDuty account dashboard and follow these steps:

1. In the top navbar, choose Integrations > Generic Webhooks (V3).
2. Click “New Webhook”
3. In the Webhook URL, insert the following value: **https://api.merlinn.co/webhooks/pagerduty**
4. In the scope type, choose **"Account"**
5. In the event subscription section, click “Deselect all” and choose only “incident.triggered”
6. Add a custom header called **"x-merlinn-secret"** and insert your secret.
7. Click “Add Webhook”

That's it! Now Merlinn will be notified when an incident happens.
