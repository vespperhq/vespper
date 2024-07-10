// eslint-disable-next-line @typescript-eslint/no-var-requires
const sdk = require("@ory/kratos-client"); // For some reason, import crashes here. using require for now

function isJsonMime(mime: string): boolean {
  const jsonMimeTypes = [
    "application/json",
    "application/json; charset=UTF8",
    "APPLICATION/JSON",
    "application/vnd.company+json",
  ];

  return jsonMimeTypes.includes(mime.toLowerCase());
}

const identityClient = new sdk.IdentityApi({
  basePath: process.env.KRATOS_ADMIN_URL,
  isJsonMime,
});

export const getOryIdentity = async (id: string) => {
  const response = await identityClient.getIdentity({ id });
  return response.data;
};

export const createOryIdentity = async (email: string) => {
  const response = await identityClient.createIdentity({
    createIdentityBody: {
      schema_id: "default",
      traits: { email },
    },
  });
  return response.data;
};

export const deleteOryIdentity = async (id: string) => {
  const response = await identityClient.deleteIdentity({ id });
  return response.data;
};

export const createRecoveryLink = async (id: string) => {
  const response = await identityClient.createRecoveryLinkForIdentity({
    createRecoveryLinkForIdentityBody: { identity_id: id },
  });
  return response.data;
};
