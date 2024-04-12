import axios, { AxiosInstance } from "axios";
import { CoralogixLogRecord, CoralogixRegionKey } from "../../types";
import { domains } from "./constants";
import {
  CoralogixGetAlertsResponse,
  CoralogixQueryRequest,
  CoralogixQueryResult,
} from "../../types";
import { getTimestamp } from "../../utils/dates";
import { flatten } from "../../utils/objects";

interface CoralogixAPIKeys {
  logsKey?: string;
  artKey?: string;
}
export class CoralogixClient {
  private readonly apiKeys: CoralogixAPIKeys;
  private readonly region: CoralogixRegionKey;
  private readonly axios: AxiosInstance;

  constructor(apiKeys: CoralogixAPIKeys, region: CoralogixRegionKey) {
    this.apiKeys = apiKeys;
    this.region = region;

    this.axios = axios.create();
    this.axios.interceptors.request.use((config) => {
      if (config.url?.endsWith("api/v1/dataprime/query")) {
        config.headers.Authorization = `Bearer ${this.apiKeys.logsKey}`;
      } else if (config.url?.endsWith("api/v1/external/alerts")) {
        config.headers.Authorization = `Bearer ${this.apiKeys.artKey}`;
      }
      config.headers["Content-Type"] = "application/json";
      return config;
    });
  }

  getLogs = async (
    request: CoralogixQueryRequest,
  ): Promise<CoralogixQueryResult> => {
    const { query, startDate, endDate, syntax } = request;
    const { apiURL } = domains.management[this.region];
    const metadata = { syntax, startDate, endDate };
    try {
      const { data: result } = await this.axios.post<CoralogixQueryResult>(
        apiURL,
        { query, metadata },
      );

      if (typeof result === "string") {
        const objects = (result as string)
          .split("\n")
          .filter((obj: string) => !!obj) as string[];
        const results = objects.map((obj) => JSON.parse(obj));
        const logs = results
          .reduce((total, current) => [...total, ...current.result.results], [])
          .map((o: CoralogixLogRecord) => ({
            ...o,
            userData: JSON.stringify(flatten(JSON.parse(o.userData))),
          }));
        return { result: { results: logs } };
      } else {
        if (result.result) {
          result.result.results = result.result.results.map((o) => ({
            ...o,
            userData: JSON.stringify(flatten(JSON.parse(o.userData))),
          }));
        }
      }
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getAlerts = async () => {
    const { apiURL } = domains.externalAlerts[this.region];
    try {
      const response = await this.axios.get<CoralogixGetAlertsResponse>(apiURL);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getLogsByAlertName = async (alertName: string) => {
    try {
      const { alerts } = await this.getAlerts();
      const alert = alerts.find((alert) => alert.name.includes(alertName));
      if (!alert) {
        return null;
      }

      // We take 5 minutes margin from the lastTriggered date of the alert
      const startDate = getTimestamp({
        offset: alert.lastTriggered,
        // amount: 5,
        amount: 1,
        scale: "hours",
        // scale: "minutes",
      });
      const endDate = new Date().toISOString();

      const logs = await this.getLogs({
        query: alert.log_filter.text,
        syntax: "QUERY_SYNTAX_LUCENE",
        startDate,
        endDate,
      });

      return logs;
    } catch (error) {
      console.log(error);
      return null;
    }
  };
}
