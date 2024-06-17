---
sidebar_class_name: pagerduty
---

# PagerDuty

This guide shows you how to integrate Merlinn with PagerDuty.

## Overview

Merlinn uses PagerDuty in order to obtain information about live incidents and alerts.

On the techical side, Merlinn uses the standard OAuth flow to connect to PagerDuty. For more information, check the [PagerDuty documentation](https://developer.pagerduty.com/docs/f59fdbd94ceab-o-auth-functionality).

## Prerequisites

- An existing Merlinn account. If you don't have one, you can [sign up](https://app.merlinn.co/) for free.
- An existing organization. To learn how to create one, check the [quickstart](../02-Quickstart.md) guide.

## Setup

Follow these steps to connect Merlinn to PagerDuty:

1. Inside your organization settings, go to "Integrations".
2. Locate the "PagerDuty" integration and click "Add".
3. Follow the link and authorize PagerDuty. You should be presented with PagerDuty's consent screen.
4. Once authorized, you should see a text message saying "Successfully integrated PagerDuty!". You can return to the dashboard.
