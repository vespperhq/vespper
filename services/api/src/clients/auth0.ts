import { ManagementClient } from "auth0";

export const management = new ManagementClient({
  domain: process.env.AUTH0_ISSUER_BASE_URL as string,
  clientId: process.env.AUTH0_CLIENT_ID as string,
  clientSecret: process.env.AUTH0_CLIENT_SECRET as string,
});

export const getAuth0User = async (userId: string) => {
  const response = await management.users.get({ id: userId });
  return response.data;
};

export const createAuth0User = async (email: string) => {
  const response = await management.users.create({
    password: process.env.AUTH0_TEMPORARY_PASSWORD, // Temporary password
    email,
    email_verified: false,
    connection: "Username-Password-Authentication",
    verify_email: false,
  });
  return response.data;
};

export const deleteAuth0User = async (userId: string) => {
  const response = await management.users.delete({ id: userId });
  return response.data;
};

export const createResetTicket = async (user_id: string) => {
  const response = await management.tickets.changePassword({
    user_id,
    result_url: process.env.APP_URL as string,
    ttl_sec: 0,
    mark_email_as_verified: false,
    includeEmailInRedirect: false,
  });
  return response.data;
};
