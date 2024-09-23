import {
  OpsgenieClient,
  CoralogixClient,
  GrafanaClient,
} from "../../../clients";
import { integrationModel } from "@vespper/db";
import type {
  CoralogixIntegration,
  GrafanaIntegration,
  OpsgenieIntegration,
} from "@vespper/db";
import type { OpsgenieAlert } from "../../../types";
import type { AlertEvent } from "../../../types/internal";
import { secretManager } from "../../../common/secrets";

export const parseAlert = async (
  alertId: string,
  organizationId: string,
): Promise<AlertEvent> => {
  let opsgenieIntegration = (await integrationModel.getIntegrationByName(
    "Opsgenie",
    {
      organization: organizationId,
    },
  )) as OpsgenieIntegration;
  if (!opsgenieIntegration) {
    throw new Error(
      `No Opsgenie integration for organization ${organizationId}`,
    );
  }

  opsgenieIntegration = (
    await secretManager.populateCredentials([opsgenieIntegration])
  )[0] as OpsgenieIntegration;

  const { apiKey } = opsgenieIntegration.credentials;
  const { region } = opsgenieIntegration.metadata;
  const opsgenieClient = new OpsgenieClient(apiKey, region);

  const account = await opsgenieClient.getAccountInfo();
  const { data: alert } = await opsgenieClient.getAlert(alertId);

  const event: AlertEvent = {
    source: "Opsgenie",
    message: alert.message,
    createdAt: alert.createdAt,
  };

  if (account.data.plan.name !== "Enterprise") {
    console.log(
      "Opsgenie plan is not Enterprise. Trying to track the underlying source",
    );

    const data = await (() => {
      switch (alert.source) {
        case "Coralogix": {
          return getDataFromCoralogix(alert, organizationId);
        }
        case "Grafana": {
          return getDataFromGrafana(alert, organizationId);
        }
        default:
          return null;
      }
    })();

    if (data) {
      return { ...event, data };
    }
    return event;
  } else {
    console.log(
      "Opsgenie plan is Enterprise. Trying to fetch the 'Processed incomingData' log",
    );
    const data = await opsgenieClient.getAlertIncomingPayload(alert);
    if (!data) {
      console.log("Opsgenie enrichment failed");
      return event;
    }
    return { ...event, data };
  }
};

const getDataFromCoralogix = async (
  alert: OpsgenieAlert,
  organizationId: string,
) => {
  let coralogixIntegration = (await integrationModel.getIntegrationByName(
    "Coralogix",
    {
      organization: organizationId,
    },
  )) as CoralogixIntegration;
  if (!coralogixIntegration) {
    return null;
  }

  coralogixIntegration = (
    await secretManager.populateCredentials([coralogixIntegration])
  )[0] as CoralogixIntegration;

  const { logsKey, artKey } = coralogixIntegration.credentials;
  const { region } = coralogixIntegration.metadata;
  const coralogixClient = new CoralogixClient({ logsKey, artKey }, region);
  const alertName = alert.message.replace("[Coralogix]", "").trim();
  const logs = await coralogixClient.getLogsByAlertName(alertName);
  if (!logs) {
    console.log(`Could not find Coralogix logs for alert name: ${alertName}`);
    return null;
  }
  return { logs };
};

const getDataFromGrafana = async (
  opsAlert: OpsgenieAlert,
  organizationId: string,
) => {
  let grafanaIntegration = (await integrationModel.getIntegrationByName(
    "Grafana",
    {
      organization: organizationId,
    },
  )) as GrafanaIntegration;
  if (!grafanaIntegration) {
    return null;
  }

  grafanaIntegration = (
    await secretManager.populateCredentials([grafanaIntegration])
  )[0] as GrafanaIntegration;

  const { token } = grafanaIntegration.credentials;
  const { instanceURL } = grafanaIntegration.metadata;
  const coralogixClient = new GrafanaClient(token, instanceURL);

  const alertNameTag = opsAlert.tags.find((tag) => tag.includes("alertname:"));
  if (!alertNameTag) {
    throw new Error(`Could not find alert name in tags: ${opsAlert.tags}`);
  }
  const alertName = alertNameTag.split(":")[1].trim();

  const alerts = await coralogixClient.getAlerts();
  const alert = alerts.find((a) => a.labels.alertname === alertName);
  if (!alert) {
    throw new Error(`Could not find alert with name: ${alertName}`);
  }

  // TODO: fix this so we check other groups
  const alertRules = await coralogixClient.getAlertsRules();
  const firstGroup = alertRules.data.groups[0];
  const alertRule = firstGroup.rules.find((rule) => rule.name === alertName);
  if (!alertRule) {
    throw new Error(`Could not find alert rule with name: ${alertName}`);
  }

  return { alert, alertRule };
};
