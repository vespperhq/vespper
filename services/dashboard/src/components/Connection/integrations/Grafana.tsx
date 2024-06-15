/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { API_SERVER_URL } from "../../../constants";
import { ConnectionProps, ConnectionName } from "../../../types/Connections";
import { FieldConfiguration, IntegrationPayload } from "../types";
import { ConnectionWrapper } from "../styles";
import { IntegrationField } from "../components/IntegrationField";

const fieldsConfigurations: FieldConfiguration[] = [
  {
    key: "token",
    label: "Token",
    type: "credentials",
    input: { type: "secret" },
  },
  { key: "instanceURL", label: "Grafana API URL", type: "metadata" },
];

export const ConnectGrafanaIntegration = ({
  orgId,
  formData,
  setFormData,
  setRequestData,
  data,
}: ConnectionProps) => {
  const updateState = useCallback(
    async ({ key, value, type }: any) => {
      setRequestData((prev: any) => {
        const body: IntegrationPayload = {
          vendor: ConnectionName.Grafana,
          organization: orgId,
          metadata: { ...(prev?.body?.metadata || {}) },
          credentials: { ...(prev?.body?.credentials || {}) },
        };

        body[type as keyof IntegrationPayload][key] = value;

        return {
          url: `${API_SERVER_URL}/integrations`,
          body,
        };
      });
    },
    [orgId, setRequestData],
  );

  return (
    <ConnectionWrapper>
      {data ? (
        "Provided information:"
      ) : (
        <span>
          Please provide a service account token and an instance URL. To learn
          how to these, visit this{" "}
          <a
            target="_blank"
            href="https://grafana.com/docs/grafana/latest/developers/http_api/"
          >
            link
          </a>
          .
        </span>
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
