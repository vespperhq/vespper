import axios from "axios";

interface GetTokenPayload {
  grant_type: "authorization_code" | "refresh_token";
  client_id: string;
  client_secret: string;
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
}

export class AtlassianClient {
  // OAuth methods
  static getToken = async (params: GetTokenPayload) => {
    const { grant_type, redirect_uri, code, refresh_token } = params;
    if (grant_type === "authorization_code" && (!code || !redirect_uri)) {
      throw new Error("Missing code and/or redirect_uri");
    } else if (grant_type === "refresh_token" && !refresh_token) {
      throw new Error("Missing refresh token");
    } else if (grant_type === "authorization_code" && refresh_token) {
      throw new Error("Cannot use refresh token with code grant");
    } else if (grant_type === "refresh_token" && code) {
      throw new Error("Cannot use code with refresh token grant");
    }

    const response = await axios.post(
      "https://auth.atlassian.com/oauth/token",
      params,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response;
  };
}
