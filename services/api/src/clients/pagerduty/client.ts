import https from "https";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  PagerDutyGetIncidentResponse,
  PagerDutyGetLogEntryResponse,
  PagerDutyGetTokenPayload,
  PagerDutyGetUsersResponse,
} from "../../types";

export class PagerDutyClient {
  private readonly token: string;
  private readonly axios: AxiosInstance;

  constructor(token: string) {
    this.token = token;

    this.axios = axios.create({
      baseURL: "https://api.pagerduty.com",
      // I could not make PagerDuty TLS work, so now I don't throw an error on TLS rejection.
      // https://developer.pagerduty.com/docs/531092d4c6658-rest-api-v2-overview#tls
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        requestCert: false,
      }),
    });

    this.axios.interceptors.request.use((config) => {
      config.headers.Authorization = `Token token=${token}`;
      return config;
    });
  }

  getIncident = async (id: string) => {
    const response = await this.axios.get<PagerDutyGetIncidentResponse>(
      `/incidents/${id}?include[]=first_trigger_log_entries`,
    );
    return response.data;
  };

  getUsers = async () => {
    // TODO: Currently throws an error
    const response = await this.axios.get<
      unknown,
      AxiosResponse<PagerDutyGetUsersResponse>
    >("/users");
    return response.data.users;
  };

  getLogEntry = async (id: string) => {
    const response = await this.axios.get<PagerDutyGetLogEntryResponse>(
      `/log_entries/${id}?include[]=channels`,
    );
    return response.data;
  };

  // OAuth methods
  static getToken = async ({
    grant_type,
    redirect_uri,
    code,
    refresh_token,
    client_id,
    client_secret,
  }: PagerDutyGetTokenPayload) => {
    if (grant_type === "authorization_code" && (!code || !redirect_uri)) {
      throw new Error("Missing code and/or redirect_uri");
    } else if (grant_type === "refresh_token" && !refresh_token) {
      throw new Error("Missing refresh token");
    } else if (grant_type === "authorization_code" && refresh_token) {
      throw new Error("Cannot use refresh token with code grant");
    } else if (grant_type === "refresh_token" && code) {
      throw new Error("Cannot use code with refresh token grant");
    }

    const params = new URLSearchParams();
    params.append("grant_type", grant_type);
    params.append("client_id", client_id);
    params.append("client_secret", client_secret);

    if (grant_type === "authorization_code") {
      params.append("code", code as string);
      params.append("redirect_uri", redirect_uri as string);
    } else {
      params.append("refresh_token", refresh_token as string);
    }

    const response = await axios.post(
      "https://identity.pagerduty.com/oauth/token",
      params,
    );
    return response;
  };
}
