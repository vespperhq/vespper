import { SecretsBackend } from "./base";
import { Client } from "@litehex/node-vault";
import { Integration } from "@merlinn/db";
import type { IIntegration } from "@merlinn/db";

export class HashiCorpVaultSecretManager extends SecretsBackend {
  readonly client: Client;
  readonly rootToken: string;
  readonly unsealToken: string;
  readonly mountPath: string = "secret";

  constructor(
    rootToken: string,
    unsealToken: string,
    endpoint: string = "http://127.0.0.1:8200",
  ) {
    super();
    this.rootToken = rootToken;
    this.unsealToken = unsealToken;
    this.client = new Client({
      apiVersion: "v1", // default
      endpoint,
      token: this.rootToken,
    });
  }

  async verify() {
    await this.client.unseal({ key: this.unsealToken });
    const info = await this.client.engineInfo({ mountPath: this.mountPath });

    if (info.errors?.length) {
      await this.client.mount({
        mountPath: this.mountPath,
        type: "kv-v2",
      });
    }
  }
  async fetchSecrets(
    secretNames: string[],
  ): Promise<{ [key: string]: string }> {
    await this.verify();

    const result: { [key: string]: string } = {};
    const secretsPromises = secretNames.map(async (secretName) => {
      try {
        const response = (await this.client.kv2.read({
          mountPath: "secret",
          path: secretName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any;

        if (response.errors?.length > 0) {
          throw new Error(
            `Could not found secret ${secretName}. Errors: ${response.errors}`,
          );
        }

        const value = response.data.data.value as string;
        result[secretName] = value;
      } catch (error) {
        console.error(`Error fetching secret ${secretName}:`, error);
      }
    });

    await Promise.all(secretsPromises);

    return result;
  }

  async createSecret(secretName: string, secretValue: string): Promise<void> {
    try {
      await this.verify();

      const response = (await this.client.kv2.write({
        mountPath: this.mountPath,
        path: secretName,
        data: { value: secretValue },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any;

      if (response.errors?.length > 0) {
        throw new Error(
          `Could not create secret ${secretName}. Errors: ${response.errors}`,
        );
      }

      console.log("response", JSON.stringify(response));
    } catch (err) {
      throw new Error(`Failed creating a secret. Error: ${err}`);
    }
  }

  async createCredentials(
    organizationId: string,
    vendor: string,
    credentials: { [key: string]: string },
  ): Promise<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedCredentials: any = {};
    const env = process.env.NODE_ENV as string;

    for (const key in credentials) {
      const secretName = `${env}-${organizationId}-integration-${vendor}-${key}`;
      await this.createSecret(
        secretName,
        credentials[key as keyof typeof credentials],
      );
      if (key) {
        formattedCredentials[key] = secretName;
      }
    }

    return formattedCredentials;
  }

  async recreateCredentials(
    integration: IIntegration,
    values: Record<string, string>,
  ): Promise<void> {
    // Delete current
    await Promise.all(
      Object.keys(values).map((key) =>
        this.deleteSecret(integration.credentials[key as never] as string),
      ),
    );
    await Promise.all(
      Object.keys(values).map((key) =>
        this.createSecret(integration.credentials[key as never], values[key]),
      ),
    );
  }

  private getSecretNames(integrations: IIntegration[]) {
    const secretNames: string[] = [];

    integrations.forEach((integration: IIntegration) => {
      if (
        !integration.credentials ||
        !Object.keys(integration.credentials).length
      ) {
        return;
      }
      secretNames.push(...Object.values(integration.credentials));
    });

    return secretNames;
  }

  async populateCredentials(
    integrations: IIntegration[],
  ): Promise<IIntegration[]> {
    const secretNames = this.getSecretNames(integrations);
    const secrets = await this.fetchSecrets(secretNames);

    const populated = integrations.map((integration: IIntegration) => {
      if (
        !integration.credentials ||
        !Object.keys(integration.credentials).length
      ) {
        return integration;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newCredentials: any = {};
      const newIntegration = new Integration(integration);
      Object.entries(newIntegration.credentials).forEach(
        ([key, secretName]) => {
          newCredentials[key] = secrets[secretName];
        },
      );
      newIntegration.credentials = newCredentials;
      return newIntegration;
    });

    return populated;
  }

  async deleteCredentials(integrations: IIntegration[]): Promise<void> {
    const secretNames = this.getSecretNames(integrations);

    const deletionPromises = secretNames.map(this.deleteSecret);

    // Wait for all promises to complete
    await Promise.all(deletionPromises);
  }

  deleteSecret = async (secretName: string): Promise<void> => {
    await this.verify();

    const result = (await this.client.kv2.readMetadata({
      mountPath: this.mountPath,
      path: secretName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;
    if (result.errors?.length > 0) {
      throw new Error(`Could not found secret ${secretName}`);
    }

    const versions = Object.keys(result.data.versions).map(Number);

    await this.client.kv2.destroy({
      mountPath: this.mountPath,
      path: secretName,
      versions: versions,
    });

    await this.client.kv2.deleteMetadata({
      mountPath: this.mountPath,
      path: secretName,
    });
  };
}
