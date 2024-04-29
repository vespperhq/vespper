/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { API_SERVER_URL, AUTH0_AUDIENCE } from "../../../constants";
import { useAuth0 } from "@auth0/auth0-react";
import { ConnectionProps, ConnectionName } from "../../../types/Connections";
import { FieldConfiguration, IntegrationPayload } from "../types";
import { ConnectionWrapper } from "../styles";
import { IntegrationField } from "../components/IntegrationField";

const fieldsConfigurations: FieldConfiguration[] = [
  { key: "instanceUrl", label: "Jaeger URL", type: "metadata" },
];

export const ConnectJaegerIntegration = ({
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
          vendor: ConnectionName.Jaeger,
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

  return (
    <ConnectionWrapper>
      {data ? (
        "Provided information:"
      ) : (
        <span>Please provide the API URL of your Jaeger instance.</span>
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
