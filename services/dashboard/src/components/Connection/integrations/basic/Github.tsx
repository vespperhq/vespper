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
    label: "Personal Access Token (Classic)",
    type: "credentials",
    input: { type: "secret" },
  },
  {
    key: "reposToSync",
    label: "Repositories to sync",
    subtitle:
      "Comma-separated list of repositories, e.g. owner/repo1,owner/repo2. Leave empty to sync all repositories.",
    type: "settings",
  },
];

export const ConnectGithubIntegration = ({
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
          vendor: ConnectionName.Github,
          organization: orgId,
          metadata: { ...(prev?.body?.metadata || {}) },
          credentials: { ...(prev?.body?.credentials || {}) },
          settings: { ...(prev?.body?.settings || {}) },
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
            Please generate a personal access token (classic) in your Github
            account. For more information, visit the{" "}
            <a
              href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic"
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
