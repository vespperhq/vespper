import { IIntegration } from "@merlinn/db";

export abstract class SecretsBackend {
  abstract fetchSecrets(
    secretNames: string[],
  ): Promise<{ [key: string]: string }>;
  abstract createSecret(secretName: string, secretValue: string): Promise<void>;
  abstract createCredentials(
    organizationId: string,
    vendor: string,
    credentials: { [key: string]: string },
  ): Promise<unknown>;
  abstract recreateCredentials(
    integration: IIntegration,
    values: Record<string, string>,
  ): Promise<void>;
  abstract populateCredentials(
    integrations: IIntegration[],
  ): Promise<IIntegration[]>;
  abstract deleteCredentials(integrations: IIntegration[]): Promise<void>;
  abstract deleteSecret(secretName: string): Promise<void>;
}
