import { Types } from "mongoose";
import { CoralogixRegionKey } from "./vendors";

// Beta
export interface IBetaCode {
  _id: Types.ObjectId;
  code: string;
  status: "new" | "used";
}

// Plan
export enum PlanFieldCode {
  seats = "seats",
  alerts = "alerts",
  queries = "queries",
  indexingAttempts = "indexingAttempts",
  indexingDocuments = "indexingDocuments",
}

export enum ResetMode {
  manual = "manual",
  hourly = "hourly",
  daily = "daily",
  weekly = "weekly",
  monthly = "monthly",
  yearly = "yearly",
}

export enum PlanFieldKind {
  number = "number",
  boolean = "boolean",
  string = "string",
}

export interface IPlanField {
  _id: Types.ObjectId;
  name: string;
  code: PlanFieldCode;
  kind: PlanFieldKind;
  initialValue?: number | boolean | string;
  granularity: "user" | "organization";
  canExceedLimit?: boolean;
  resetMode?: ResetMode;
}

export interface IPlan {
  _id: Types.ObjectId;
  name: string;
  fields: (IPlanField | Types.ObjectId)[];
  values: Record<string, number | boolean | string>;
}

export interface OrgLevelFieldState {
  value: number;
}

export interface UserLevelFieldState {
  users: Record<string, number>;
}

export interface ComputedUserLevelFieldState
  extends Omit<UserLevelFieldState, "users"> {
  value: number;
  limit: number;
  isAllowed: boolean;
}
export interface ComputedOrgLevelFieldState extends OrgLevelFieldState {
  limit: number;
  isAllowed: boolean;
}

export type FieldsState = Record<
  string,
  UserLevelFieldState | OrgLevelFieldState
>;

export interface IPlanState {
  _id: Types.ObjectId;
  plan: Types.ObjectId | IPlan;
  organization: Types.ObjectId | IOrganization;
  state: FieldsState;
}

// Vendor
export interface IVendor {
  _id: Types.ObjectId;
  name: VendorName;
  description: string;
}

export interface IIndex {
  _id: Types.ObjectId;
  name: string;
  organization: Types.ObjectId | IOrganization;
  dataSources: VendorName[];
  state: {
    status: "pending" | "created" | "failed";
    integrations: {
      [key: string]: "in_progress" | "in_queue" | "completed" | "failed";
    };
  };
  stats: { [key: string]: number };
}

// User
export interface IUser {
  _id: Types.ObjectId;
  auth0Id: string;
  email: string;
  status: "activated" | "invited";
  role: "owner" | "member";
  organization: IOrganization;
}

export interface EnrichedUser {
  _id: Types.ObjectId;
  auth0Id: string;
  status: "activated" | "invited";
  role: "owner" | "member";
  email: string;
  name: string;
  picture: string;
}

// Organization
export interface IOrganization {
  _id: Types.ObjectId;
  name: string;
  plan: IPlan | Types.ObjectId;
}

// Integration
export interface BaseConnection {
  _id: Types.ObjectId;
  vendor: IVendor;
  organization: IOrganization;
  settings?: {
    tools?: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SlackIntegration extends BaseConnection {
  credentials: {
    access_token: string;
  };
  metadata: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
    team: {
      id: string;
      name: string;
    };
    enterprise: {
      id: string;
      name: string;
    };
  };
}

export interface PagerDutyIntegration extends BaseConnection {
  credentials: {
    id_token: string;
    access_token: string;
    refresh_token: string;
  };
  metadata: {
    client_info: string;
    token_type: string;
    scope: string;
    expires_in: number;
  };
}

export interface OpsgenieIntegration extends BaseConnection {
  credentials: {
    apiKey: string;
  };
  metadata: {
    region: "us" | "eu";
  };
}

export interface CoralogixIntegration extends BaseConnection {
  credentials: {
    logsKey: string; // Logs Query Key in Coralogix
    artKey: string; // Alerts, Rules and Tags Key
  };
  metadata: {
    region: CoralogixRegionKey;
    domainURL: string;
  };
  settings: {
    tools?: {
      readLogs?: CoralogixReadLogsToolSettings;
    };
  };
}

export interface DataDogIntegration extends BaseConnection {
  credentials: {
    apiKey: string;
    appKey: string;
  };
  metadata: {
    region?: "eu" | "us";
  };
}

export interface GithubIntegration extends BaseConnection {
  credentials: {
    access_token: string;
  };
  metadata: {
    scope: string;
    token_type: string;
  };
}

export interface NotionIntegration extends BaseConnection {
  credentials: {
    access_token: string;
  };
  metadata: {
    bot_id: string;
    duplicated_template_id: string;
    owner: string;
    workspace_icon: string;
    workspace_id: string;
    workspace_name: string;
  };
}

export interface AtlassianIntegration extends BaseConnection {
  credentials: {
    access_token: string;
    refresh_token: string;
  };
  metadata: {
    expires_in: string;
    scope: string;
  };
}

export interface ConfluenceIntegration extends AtlassianIntegration {}

export interface JiraIntegration extends AtlassianIntegration {}

export interface MongoDBIntegration extends BaseConnection {
  credentials: {
    dbUrl: string;
  };
}

export type IIntegration =
  | SlackIntegration
  | PagerDutyIntegration
  | OpsgenieIntegration
  | CoralogixIntegration
  | DataDogIntegration
  | GithubIntegration
  | NotionIntegration
  | ConfluenceIntegration
  | JiraIntegration
  | MongoDBIntegration;

export interface IWebhook extends BaseConnection {
  secret: string;
}

// Tool Settings
export interface CoralogixReadLogsToolSettings {
  allowedFields: string[];
}

export enum VendorName {
  Github = "Github",
  Coralogix = "Coralogix",
  Opsgenie = "Opsgenie",
  Slack = "Slack",
  PagerDuty = "PagerDuty",
  DataDog = "DataDog",
  MongoDB = "MongoDB",
}
