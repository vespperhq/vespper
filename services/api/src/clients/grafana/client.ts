import axios, { AxiosInstance } from "axios";
import { GrafanaGetAlertsResponse, GrafanaGetRulesResponse } from "../../types";

export class GrafanaClient {
  private readonly token: string;
  private readonly instanceURL: string;
  private readonly axios: AxiosInstance;

  constructor(token: string, instanceURL: string) {
    this.token = token;
    this.instanceURL = instanceURL;

    this.axios = axios.create({
      baseURL: instanceURL,
    });
    this.axios.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${this.token}`;
      return config;
    });
  }

  getAlerts = async () => {
    try {
      const response = await this.axios.get<GrafanaGetAlertsResponse>(
        "/alertmanager/grafana/api/v2/alerts",
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getAlertsRules = async () => {
    try {
      const response = await this.axios.get<GrafanaGetRulesResponse>(
        "/prometheus/grafana/api/v1/rules",
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // private extractIncomingDataId(log: string): string | null {
  //   const regex = /incomingDataId\[([a-f\d-]+)\]/;
  //   const match = log.match(regex);

  //   if (match && match[1]) {
  //     return match[1];
  //   } else {
  //     return null;
  //   }
  // }
}
