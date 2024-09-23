import { SecretsBackend } from "./base";
import { promises as fs } from "fs";
import path from "path";
import { Integration } from "@vespper/db";
import type { IIntegration } from "@vespper/db";

export class FileSecretManager extends SecretsBackend {
  readonly directory: string;

  constructor(directory: string) {
    super();
    this.directory = directory;
  }

  private async verifyDirectory() {
    try {
      await fs.access(this.directory);
    } catch (error) {
      await fs.mkdir(this.directory, { recursive: true });
    }
  }

  private getFilePath(secretName: string) {
    return path.join(this.directory, secretName);
  }

  async fetchSecrets(
    secretNames: string[],
  ): Promise<{ [key: string]: string }> {
    await this.verifyDirectory();

    const result: { [key: string]: string } = {};
    const secretsPromises = secretNames.map(async (secretName) => {
      try {
        const filePath = this.getFilePath(secretName);
        const value = await fs.readFile(filePath, "utf8");
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
      await this.verifyDirectory();
      const filePath = this.getFilePath(secretName);
      await fs.writeFile(filePath, secretValue, "utf8");
    } catch (err) {
      throw new Error(`Failed creating a secret. Error: ${err}`);
    }
  }

  async createCredentials(
    organizationId: string,
    vendor: string,
    credentials: { [key: string]: string },
  ): Promise<unknown> {
    const formattedCredentials: { [key: string]: string } = {};
    const env = process.env.NODE_ENV as string;

    for (const key in credentials) {
      const secretName = `${env}-${organizationId}-integration-${vendor}-${key}`;
      await this.createSecret(secretName, credentials[key]);
      formattedCredentials[key] = secretName;
    }

    return formattedCredentials;
  }

  async recreateCredentials(
    integration: IIntegration,
    values: Record<string, string>,
  ): Promise<void> {
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

      const newCredentials: { [key: string]: string } = {};
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

    await Promise.all(deletionPromises);
  }

  deleteSecret = async (secretName: string): Promise<void> => {
    await this.verifyDirectory();
    const filePath = this.getFilePath(secretName);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting secret ${secretName}:`, error);
    }
  };
}
