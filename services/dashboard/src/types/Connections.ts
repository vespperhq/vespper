/* eslint-disable @typescript-eslint/no-explicit-any */

export enum ConnectionName {
  Github = "Github",
  Coralogix = "Coralogix",
  Opsgenie = "Opsgenie",
  Slack = "Slack",
  PagerDuty = "PagerDuty",
  DataDog = "DataDog",
  Notion = "Notion",
  Confluence = "Confluence",
  Jira = "Jira",
  MongoDB = "MongoDB",
  Grafana = "Grafana",
  Jaeger = "Jaeger",
  Prometheus = "Prometheus",
  AlertManager = "Alert Manager",
}

export enum ConnectionType {
  Integration = "Integration",
  Webhook = "Webhook",
}

export interface Vendor {
  name: ConnectionName;
  description: string;
}

export interface ConnectionProps {
  orgId: string;
  formData?: any;
  setFormData: (value: any) => any;
  setRequestData: (value: any) => any;
  data?: any;
}

export enum Mode {
  View = "View",
  Connect = "Connect",
}
