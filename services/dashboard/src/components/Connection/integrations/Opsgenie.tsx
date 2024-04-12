/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { API_SERVER_URL, AUTH0_AUDIENCE } from "../../../constants";
import { useAuth0 } from "@auth0/auth0-react";
import { ConnectionProps, ConnectionName } from "../../../types/Connections";
import { FieldConfiguration, IntegrationPayload } from "../types";
import { ConnectionWrapper } from "../styles";
import { IntegrationField } from "../components/IntegrationField";

const fieldsConfigurations: FieldConfiguration[] = [
  {
    key: "apiKey",
    label: "API Key",
    type: "credentials",
    input: { type: "secret" },
  },
  {
    key: "region",
    label: "Region",
    type: "metadata",
    input: { type: "select", options: ["us", "eu"] },
  },
];

export const ConnectOpsgenieIntegration = ({
  orgId,
  formData,
  setFormData,
  setRequestData,
  data,
}: ConnectionProps) => {
  const auth0 = useAuth0();

  const updateState = useCallback(
    async ({ key, value, type }: any) => {
      const accessToken = await auth0.getAccessTokenSilently({
        authorizationParams: { audience: AUTH0_AUDIENCE },
      });
      setRequestData((prev: any) => {
        const body: IntegrationPayload = {
          vendor: ConnectionName.Opsgenie,
          organization: orgId,
          metadata: { ...(prev?.body?.metadata || {}) },
          credentials: { ...(prev?.body?.credentials || {}) },
        };

        body[type as keyof IntegrationPayload][key] = value;

        return {
          url: `${API_SERVER_URL}/integrations`,
          config: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
          body,
        };
      });
    },
    [orgId, auth0, setRequestData],
  );

  // https://support.atlassian.com/opsgenie/docs/create-a-default-api-integration/
  return (
    <ConnectionWrapper>
      {data ? (
        "Provided information:"
      ) : (
        <>
          <span>
            Please create an API integration in Opsgenie and copy the API key.
          </span>
          <span>
            For more information, visit the following{" "}
            <a
              href="https://support.atlassian.com/opsgenie/docs/create-a-default-api-integration/"
              target="_blank"
            >
              link
            </a>
            .
          </span>
        </>
      )}
      {fieldsConfigurations.map((config) => {
        const { key, type } = config;
        const currentValue = data?.[type]?.[key] || formData[key];
        const handleChange = (value: string) => {
          updateState({ key, value, type });
          setFormData((prev: any) => ({
            ...prev,
            [key]: value,
          }));
        };
        return (
          <IntegrationField
            key={config.key}
            config={config}
            value={currentValue}
            onChange={handleChange}
          />
        );
      })}
      {!data && (
        <span style={{ marginTop: "40px", fontSize: "0.8em" }}>
          When you finish click the "Connect" button
        </span>
      )}
    </ConnectionWrapper>
  );
};
