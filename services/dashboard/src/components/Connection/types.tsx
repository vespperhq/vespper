/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConnectionName } from "../../types/Connections";

export interface IntegrationPayload {
  vendor: ConnectionName;
  organization: string;
  metadata: any;
  credentials: any;
  settings?: any;
}

export interface FieldConfiguration {
  key: string;
  label: string;
  subtitle?: string;
  type: "credentials" | "metadata" | "settings";
  input?: {
    type: "select" | "text" | "secret";
    options?: string[];
  };
}
