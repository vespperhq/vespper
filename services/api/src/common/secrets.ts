import { GCPSecretManager, HashiCorpVaultSecretManager } from "@merlinn/utils";

export function getSecretManager() {
  if (
    process.env.HASHICORP_VAULT_URL &&
    process.env.HASHICORP_VAULT_ROOT_TOKEN &&
    process.env.HASHICORP_VAULT_UNSEAL_TOKEN
  ) {
    return new HashiCorpVaultSecretManager(
      process.env.HASHICORP_VAULT_ROOT_TOKEN as string,
      process.env.HASHICORP_VAULT_UNSEAL_TOKEN as string,
      process.env.HASHICORP_VAULT_URL as string,
    );
  }
  return new GCPSecretManager();
}

export const secretManager = getSecretManager();
