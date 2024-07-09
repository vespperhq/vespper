import {
  FileSecretManager,
  GCPSecretManager,
  HashiCorpVaultSecretManager,
} from "@merlinn/utils";

export function getSecretManager() {
  const secretManagerType = process.env.SECRET_MANAGER_TYPE || "file";

  switch (secretManagerType) {
    case "vault": {
      if (
        !process.env.HASHICORP_VAULT_URL ||
        !process.env.HASHICORP_VAULT_ROOT_TOKEN ||
        !process.env.HASHICORP_VAULT_UNSEAL_TOKEN
      ) {
        throw new Error("Missing HashiCorp Vault environment variables");
      }
      return new HashiCorpVaultSecretManager(
        process.env.HASHICORP_VAULT_ROOT_TOKEN as string,
        process.env.HASHICORP_VAULT_UNSEAL_TOKEN as string,
        process.env.HASHICORP_VAULT_URL as string,
      );
    }
    case "gcp": {
      return new GCPSecretManager();
    }
    case "file": {
      if (!process.env.SECRET_MANAGER_DIRECTORY) {
        throw new Error(
          "Missing SECRET_MANAGER_DIRECTORY environment variable",
        );
      }
      return new FileSecretManager(process.env.SECRET_MANAGER_DIRECTORY);
    }
    default: {
      throw new Error(`Unknown secret manager type: ${secretManagerType}`);
    }
  }
}

export const secretManager = getSecretManager();
