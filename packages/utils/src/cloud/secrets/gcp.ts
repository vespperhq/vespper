import { SecretsBackend } from "./base";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Integration } from "@vespper/db";
import type { IIntegration } from "@vespper/db";

const projectId = process.env.GCLOUD_PROJECT as string;

export class GCPSecretManager extends SecretsBackend {
  private readonly client: SecretManagerServiceClient;
  constructor() {
    super();
    this.client = new SecretManagerServiceClient();
  }

  async fetchSecrets(
    secretNames: string[],
  ): Promise<{ [key: string]: string }> {
    const result: { [key: string]: string } = {};
    const secretsPromises = secretNames.map(async (secretName) => {
      const secretPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;

      try {
        const [version] = await this.client.accessSecretVersion({
          name: secretPath,
        });

        if (!version?.payload?.data) {
          throw new Error(`Could not found secret ${secretName}`);
        }

        const payload = version.payload.data.toString();

        result[secretName] = payload;
      } catch (error) {
        console.error(`Error fetching secret ${secretName}:`, error);
      }
    });

    await Promise.all(secretsPromises);

    return result;
  }

  async createSecret(secretName: string, secretValue: string): Promise<void> {
    try {
      // Build the secret parent name.
      const parent = `projects/${projectId}`;

      // Set the payload data for the secret.
      const payload = Buffer.from(secretValue, "utf8");

      // Create the secret.
      const [secret] = await this.client.createSecret({
        parent,
        secretId: secretName,
        secret: {
          replication: {
            automatic: {}, // Use automatic replication for simplicity. Adjust as needed.
          },
        },
      });

      // Add a new version to the secret.
      await this.client.addSecretVersion({
        parent: secret.name,
        payload: {
          data: payload,
        },
      });
    } catch (err) {
      console.log("secret create err: ", err);
      throw new Error("Failed creating a secret");
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
    const secretPath = `projects/${projectId}/secrets/${secretName}`;
    await this.client.deleteSecret({ name: secretPath });
  };
}
