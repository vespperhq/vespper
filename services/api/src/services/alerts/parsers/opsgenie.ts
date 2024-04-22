import { OpsgenieClient, CoralogixClient } from "../../../clients";
import { populateCredentials } from "../../../clients/secretManager";
import { integrationModel } from "@merlinn/db";
import type { CoralogixIntegration, OpsgenieIntegration } from "@merlinn/db";
import type { OpsgenieAlert } from "../../../types";
import type { AlertEvent } from "../../../types/internal";

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
    await populateCredentials([opsgenieIntegration])
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
    throw new Error(
      `No coralogix integration for organization ${organizationId}`,
    );
  }

  coralogixIntegration = (
    await populateCredentials([coralogixIntegration])
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
