export type OpsgenieWebhookEvent = OpsgenieAlertCreatedEvent;

export interface OpsgenieAlertCreatedEvent {
  source: {
    name: string;
    type: string;
  };
  alert: {
    updatedAt: number;
    tags: string[];
    teams: string[];
    recipients: string[];
    message: string;
    username: string;
    alertId: string;
    source: string;
    alias: string;
    tinyId: string;
    createdAt: number;
    userId: string;
    entity: string;
  };
  action: string;
  integrationId: string;
  integrationName: string;
}

export interface OpsgenieAlert {
  id: string;
  tinyId: string;
  alias: string;
  message: string;
  status: string;
  acknowledged: boolean;
  isSeen: boolean;
  tags: string[];
  snoozed: boolean;
  snoozedUntil: string;
  count: number;
  lastOccurredAt: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  owner: string;
  priority: string;
  responders: { id: string; type: string }[];
  integration: {
    id: string;
    name: string;
    type: string;
  };
  report: {
    ackTime: number;
    closeTime: number;
    acknowledgedBy: string;
    closedBy: string;
  };
  actions: string[];
  entity: string;
  description: string;
  details: {
    serverName: string;
    region: string;
  };
}

export interface OpsgenieUser {
  blocked: false;
  verified: true;
  id: string;
  username: string;
  fullName: string;
  role: {
    id: string;
    name: string;
  };
  timeZone: string;
  locale: string;
  userAddress: {
    country: string;
    state: string;
    city: string;
    line: string;
    zipCode: string;
  };
  createdAt: string;
}

export interface OpsgenieAccountInfo {
  name: string;
  userCount: number;
  plan: {
    maxUserCount: number;
    name: "Free" | "Essentials" | "Standard" | "Enterprise";
    isYearly: boolean;
  };
}

export interface OpsgenieAlertLogRecord {
  log: string;
  type: string;
  owner: string;
  createdAt: string;
  offset: string;
}

export interface OpsgenieLogRecord {
  filename: string;
  date: number;
  size: number;
}

export interface OpsgenieAPIResponse<T> {
  totalCount: number;
  data: T;
  paging: {
    first: string;
    last: string;
  };
  took: number;
  requestId: string;
}

export type OpsgenieRegion = "eu" | "us";
