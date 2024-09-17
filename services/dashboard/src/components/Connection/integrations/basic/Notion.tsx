/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { API_SERVER_URL } from "../../../../constants";
import { ConnectionProps, ConnectionName } from "../../../../types/Connections";
import { FieldConfiguration, IntegrationPayload } from "../../types";
import { ConnectionWrapper } from "../../styles";
import { IntegrationField } from "../../components/IntegrationField";

const fieldsConfigurations: FieldConfiguration[] = [
  {
    key: "access_token",
    label: "API key",
    type: "credentials",
    input: { type: "secret" },
  },
];

export const ConnectNotionIntegration = ({
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
          vendor: ConnectionName.Notion,
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
        <>
          <span>
            Please obtain your API key from the Notion{" "}
            <a href="https://www.notion.so/my-integrations" target="_blank">
              integrations
            </a>{" "}
            page.
          </span>
          <span>
            For more information, visit the{" "}
            <a
              href="https://developers.notion.com/docs/authorization#internal-integration-auth-flow-set-up"
              target="_blank"
            >
              docs
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
            value={currentValue || ""}
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
