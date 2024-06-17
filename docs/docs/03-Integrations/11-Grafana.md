---
sidebar_class_name: grafana
---

# Grafana

This guide shows you how to integrate Merlinn with Grafana.

## Overview

Merlinn can access your Grafana instance and query observability data in real time (such as alert data, metrics, etc), and help you resolve issues faster.

## Prerequisites

- An existing Merlinn account. If you don't have one, you can [sign up](https://app.merlinn.co/) for free.
- An existing organization. To learn how to create one, check the [quickstart](../02-Quickstart.md) guide.

## Setup

### Create a Grafana service account

It is recommended to create a Grafana service account and a service account token and associate them with your Merlinn's organization. This way, you can specify the level of access to your Grafana instance. To create a service account in Grafana, you can follow the official [docs](https://grafana.com/docs/grafana/latest/administration/service-accounts/):

Here is a TL;DR version of the official docs:

1. Go to your Grafana home page.
2. Visit Administration -> Users and access -> Service accounts.
3. Click "Add a service account".
4. Enter a name for the service account (you can use "merlinn-sa", for instance), select "Viewer" as the role and click "Create".
5. In the newly created service account, click "Add service account token".
6. In the opened modal, use a display name for the token (you can go with the default one as well) and make sure the expiration is "No expiration". After that, click "Generate token".
7. Click "Copy to clipboard and close".

Great, now you can use the service account token you've created and assocate it to your Merlinn's organization.

### Associate the Grafana service account token with your Merlinn's organization

Once you've created a service account + service acccount token, go to your Merlinn account dashboard and follow these steps:

1. Inside your organization settings, go to "Integrations".
2. Locate the "Grafana" integration and click "Add".
3. In the modal, insert your service account token and your Grafana API URL. This url is usually the URL of your Grafana UI + "/api". For example, if your Grafana UI is at "https://grafana.example.co/", then the url should be "https://grafana.example.co/api".
4. Click "Connect"

That's it! 🚀 Now Merlinn can access your Grafana Observability data in real time.
