import axios, { AxiosInstance } from "axios";
import {
  OpsgenieAPIResponse,
  OpsgenieAccountInfo,
  OpsgenieAlert,
  OpsgenieAlertLogRecord,
  OpsgenieLogRecord,
  OpsgenieUser,
  OpsgenieRegion,
} from "../../types";
import { getTimestamp } from "../../utils/dates";
import { downloadFile } from "../../utils/http";

const BASE_URLS = {
  us: "https://api.opsgenie.com",
  eu: "https://api.eu.opsgenie.com",
} as Record<OpsgenieRegion, string>;

export class OpsgenieClient {
  private readonly apiKey: string;
  private readonly region: OpsgenieRegion;
  private readonly axios: AxiosInstance;

  constructor(apiKey: string, region: OpsgenieRegion) {
    this.apiKey = apiKey;
    this.region = region;

    this.axios = axios.create({
      baseURL: BASE_URLS[region],
    });
    this.axios.interceptors.request.use((config) => {
      config.headers.Authorization = `GenieKey ${this.apiKey}`;
      return config;
    });
  }

  getAccountInfo = async () => {
    try {
      const response =
        await this.axios.get<OpsgenieAPIResponse<OpsgenieAccountInfo>>(
          "/v2/account",
        );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getUsers = async () => {
    try {
      const response =
        await this.axios.get<OpsgenieAPIResponse<OpsgenieUser[]>>("/v2/users");
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getAlert = async (alertId: string) => {
    try {
      const response = await this.axios.get<OpsgenieAPIResponse<OpsgenieAlert>>(
        `/v2/alerts/${alertId}`,
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getAlertLogRecords = async (alertId: string) => {
    try {
      const response = await this.axios.get<
        OpsgenieAPIResponse<OpsgenieAlertLogRecord[]>
      >(`/v2/alerts/${alertId}/logs`);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getLogs = async (marker: string) => {
    // Note: this request supports limit as well. Might help with large volumes of data:
    // https://docs.opsgenie.com/docs/logs-api
    try {
      const response = await this.axios.get<
        OpsgenieAPIResponse<OpsgenieLogRecord[]>
      >(`/v2/logs/list/${marker}`);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  getLogFileDownloadLink = async (filename: string) => {
    try {
      const response = await this.axios.get<string>(
        `/v2/logs/download/${filename}`,
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  /** This function tries to trace back the alert's incoming payload, in hopes to gain more info.
   * This function only works for Opsgenie Enterprise customers, since Logs API is needed 💩
   * https://docs.opsgenie.com/docs/logs-api
   *
   * If a customer doesn't have an enterprise account, we workaround that by querying the
   * underlying integrations (Coralogix, DataDog, etc). This logic is inside the parseAlert
   *
   * For a general overview, this article describes what we try to do here:
   * https://community.atlassian.com/t5/Opsgenie-articles/How-to-Find-the-Incoming-Data-for-an-Opsgenie-Alert/ba-p/2518844
   */
  getAlertIncomingPayload = async (alert: OpsgenieAlert) => {
    const alertLogRecords = await this.getAlertLogRecords(alert.id);
    const initialLog = alertLogRecords.data.find((record) =>
      record.log.includes("Alert created via"),
    );
    if (!initialLog) {
      console.log("Could not find the incomingDataId log");
      return null;
    }
    const incomingDataId = this.extractIncomingDataId(initialLog.log);
    if (!incomingDataId) {
      console.log("Failed parsing the incomingDataId from the log");
      return null;
    }

    const marker = getTimestamp({
      offset: new Date(alert.createdAt),
      amount: 1,
      scale: "minutes",
    }) as string;

    const logRecords = await this.getLogs(marker);
    if (!logRecords.data.length) {
      console.log("No logs were found");
      return null;
    }

    const links = await Promise.all(
      logRecords.data.map((record) =>
        this.getLogFileDownloadLink(record.filename),
      ),
    );
    const alertData = await Promise.any(
      links.map(async (link) => {
        const response = await downloadFile(link);
        const jsonData = response.data.text() as string;

        // We're only interested in the Processed incomingData record from Opsgenie.
        // At the moment, there isn't a nice identifier to locate it. However,
        // this record has this phrase incomingDataId=${incomingDataId} which other records don't.
        // Other records contains incomingDataId: ${incomingDataId} as a JSON field
        if (!jsonData.includes(`incomingDataId=${incomingDataId}`)) {
          throw new Error("Log is irrelevant. Moving on");
        }
        return JSON.parse(jsonData) as Record<string, unknown>;
      }),
    );

    return alertData;
  };

  private extractIncomingDataId(log: string): string | null {
    const regex = /incomingDataId\[([a-f\d-]+)\]/;
    const match = log.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  }
}
