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
    label: "Bot User OAuth Token",
    type: "credentials",
    input: { type: "secret" },
  },
];

export const ConnectSlackIntegration = ({
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
          vendor: ConnectionName.Slack,
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
            Please obtain your bot user oauth token from the Slack app (OAuth &
            Permissions screen)
          </span>
          <span>
            For more information, visit the{" "}
            <a
              href="https://api.slack.com/tutorials/tracks/getting-a-token"
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
