import { PagerDutyClient } from "../../../clients";
import { populateCredentials } from "@merlinn/utils";
import { integrationModel, PagerDutyIntegration } from "@merlinn/db";
import { AlertEvent } from "../../../types/internal";
import { refreshPagerDutyToken } from "../../oauth";

export const parseAlert = async (
  incidentId: string,
  organizationId: string,
): Promise<AlertEvent> => {
  let pagerdutyIntegration = (await integrationModel.getIntegrationByName(
    "PagerDuty",
    {
      organization: organizationId,
    },
  )) as PagerDutyIntegration;
  if (!pagerdutyIntegration) {
    throw new Error(
      `No PagerDuty integration for organization ${organizationId}`,
    );
  }

  // TODO: Extract refresh token operation to a centralized place
  await refreshPagerDutyToken(pagerdutyIntegration._id.toString());

  pagerdutyIntegration = (
    await populateCredentials([pagerdutyIntegration])
  )[0] as PagerDutyIntegration;

  const { access_token } = pagerdutyIntegration.credentials;
  const pagerdutyClient = new PagerDutyClient(access_token);

  const { incident } = await pagerdutyClient.getIncident(incidentId);
  const { details } = incident.first_trigger_log_entry.channel;

  const event: AlertEvent = {
    source: "PagerDuty",
    message: incident.description,
    createdAt: incident.created_at,
    data: details,
  };

  return event;
};
