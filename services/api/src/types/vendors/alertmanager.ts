export interface AlertManagerAlert {
  status: string;
  labels: {
    alertname: string;
  };
  annotations: Record<string, string>;
  startsAt: string;
  endsAt: string;
  generatorURL: string;
  fingerprint: string;
}

export interface AlertManagerWebhookEvent {
  receiver: string;
  status: string;
  alerts: AlertManagerAlert[];
  groupLabels: Record<string, string>;
  commonLabels: {
    alertname: string;
  };
  commonAnnotations: Record<string, string>;
  externalURL: string;
  version: string;
  groupKey: string;
  truncatedAlerts: number;
}
