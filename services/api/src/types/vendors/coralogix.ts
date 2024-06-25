// Generic types & interfaces
export type CoralogixRegionName =
  | "eu-west-1"
  | "ap-south1"
  | "us-east2"
  | "eu-north-1"
  | "ap-southeast-1"
  | "us-west-2";
export type CoralogixRegionKey = "EU1" | "AP1" | "US1" | "EU2" | "AP2" | "US2";
export interface CoralogixDomainInfo {
  domain: string;
  region: CoralogixRegionName;
  description: string;
  apiURL: string;
}
export type CoralogixDomain = Record<CoralogixRegionKey, CoralogixDomainInfo>;

// Direct Archive API
export type CoralogixQuerySyntax =
  | "QUERY_SYNTAX_LUCENE"
  | "QUERY_SYNTAX_DATAPRIME";

export interface CoralogixQueryRequest {
  query: string;
  startDate?: string;
  endDate?: string;
  syntax?: CoralogixQuerySyntax;
}

export interface CoralogixLogRecord {
  metadata: { key: string; value: string }[];
  labels: { key: string; value: string }[];
  userData: string;
}

export interface CoralogixLogResults {
  results: CoralogixLogRecord[];
}

export interface CoralogixQueryResult {
  result: CoralogixLogResults;
}

// Alerts API
export interface CoralogixAlert {
  id: string;
  unique_identifier: string;
  name: string;
  severity: string;
  created_at: string;
  expiration: null | string;
  is_active: boolean;
  log_filter: {
    text: string;
    category: null | string;
    filter_type: string;
    severity: string[];
    application_name: string[];
    subsystem_name: string[];
    computer_name: null | string;
    class_name: null | string;
    ip_address: null | string;
    method_name: null | string;
  };
  condition: null | string;
  notifications: {
    emails: string[];
    integrations: string[];
  };
  notify_every: number;
  description: string;
  active_when: {
    timeframes: string[];
  };
  lastTriggered: string;
  notif_payload_filter: string[];
  notify_on_resolved: boolean;
  notify_group_by_only_alerts: boolean;
  notify_per_group_by_value: boolean;
  meta_labels: string[];
}

export interface CoralogixGetAlertsResponse {
  total: number;
  alerts: CoralogixAlert[];
}
