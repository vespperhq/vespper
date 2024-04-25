import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Integration } from "@merlinn/db";
import type { IIntegration } from "@merlinn/db";

const projectId = process.env.GCLOUD_PROJECT;

export const fetchSecrets = async (secretNames: string[]) => {
  const client = new SecretManagerServiceClient();

  const result: { [key: string]: string } = {};
  const secretsPromises = secretNames.map(async (secretName) => {
    const secretPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    try {
      const [version] = await client.accessSecretVersion({
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
};

export const createSecret = async (secretName: string, secretValue: string) => {
  try {
    // Create a Secret Manager client.
    const client = new SecretManagerServiceClient();

    // Build the secret parent name.
    const parent = `projects/${projectId}`;

    // Set the payload data for the secret.
    const payload = Buffer.from(secretValue, "utf8");

    // Create the secret.
    const [secret] = await client.createSecret({
      parent,
      secretId: secretName,
      secret: {
        replication: {
          automatic: {}, // Use automatic replication for simplicity. Adjust as needed.
        },
      },
    });

    // Add a new version to the secret.
    await client.addSecretVersion({
      parent: secret.name,
      payload: {
        data: payload,
      },
    });
  } catch (err) {
    console.log("secret create err: ", err);
    throw new Error("Failed creating a secret");
  }
};

export const createCredentials = async (
  organizationId: string,
  vendor: string,
  credentials: { [key: string]: string },
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedCredentials: any = {};
  const env = process.env.NODE_ENV as string;

  for (const key in credentials) {
    const secretName = `${env}-${organizationId}-integration-${vendor}-${key}`;
    await createSecret(
      secretName,
      credentials[key as keyof typeof credentials],
    );
    if (key) {
      formattedCredentials[key] = secretName;
    }
  }

  return formattedCredentials;
};

export const recreateCredentials = async (
  integration: IIntegration,
  values: Record<string, string>,
) => {
  // Delete current
  await Promise.all(
    Object.keys(values).map((key) =>
      deleteSecret(integration.credentials[key as never] as string),
    ),
  );
  await Promise.all(
    Object.keys(values).map((key) =>
      createSecret(integration.credentials[key as never], values[key]),
    ),
  );
};

const getSecretNames = (integrations: IIntegration[]) => {
  const secretNames: string[] = [];

  integrations.forEach((integration: IIntegration) => {
    secretNames.push(...Object.values(integration.credentials));
  });

  return secretNames;
};
export const populateCredentials = async (
  integrations: IIntegration[],
): Promise<IIntegration[]> => {
  const secretNames = getSecretNames(integrations);
  const secrets = await fetchSecrets(secretNames);

  const populated = integrations.map((integration: IIntegration) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newCredentials: any = {};
    const newIntegration = new Integration(integration);
    Object.entries(newIntegration.credentials).forEach(([key, secretName]) => {
      newCredentials[key] = secrets[secretName];
    });
    newIntegration.credentials = newCredentials;
    return newIntegration;
  });

  return populated;
};

export const deleteCredentials = async (integrations: IIntegration[]) => {
  // Create a Secret Manager client.
  const client = new SecretManagerServiceClient();

  const secretNames = getSecretNames(integrations);

  const deletionPromises = secretNames.map(async (secretName) => {
    const secretPath = `projects/${projectId}/secrets/${secretName}`;
    await client.deleteSecret({ name: secretPath });
  });

  // Wait for all promises to complete
  await Promise.all(deletionPromises);
};

export const deleteSecret = async (secretName: string) => {
  const secretPath = `projects/${projectId}/secrets/${secretName}`;

  const client = new SecretManagerServiceClient();
  await client.deleteSecret({ name: secretPath });
};
