import axios, { AxiosInstance } from "axios";
import { JaegerTrace, JaegerAPIResponse } from "../../types";

export class JaegerClient {
  private readonly apiUrl: string;
  private readonly axios: AxiosInstance;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;

    this.axios = axios.create({
      baseURL: this.apiUrl,
    });
  }

  getTraces = async (serviceName: string, limit = 20) => {
    try {
      const response = await this.axios.get<JaegerAPIResponse<JaegerTrace[]>>(
        `/traces?service=${serviceName}&loopback=15m&limit=${limit}`,
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
}
