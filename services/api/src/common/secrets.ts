import { GCPSecretManager, HashiCorpVaultSecretManager } from "@merlinn/utils";

export function getSecretManager() {
  if (process.env.HASHICORP_VAULT_URL && process.env.HASHICORP_VAULT_TOKEN) {
    return new HashiCorpVaultSecretManager(
      process.env.HASHICORP_VAULT_TOKEN,
      process.env.HASHICORP_VAULT_URL,
    );
  }
  return new GCPSecretManager();
}

export const secretManager = getSecretManager();
