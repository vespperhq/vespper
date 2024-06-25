interface Annotation {
  [key: string]: string;
}

interface Label {
  [key: string]: string;
}

interface Integration {
  lastNotifyAttempt: string;
  lastNotifyAttemptDuration: string;
  lastNotifyAttemptError: string;
  name: string;
  sendResolved: boolean;
}

interface Receiver {
  active: boolean;
  integrations: Integration[];
  name: string;
}

interface Status {
  inhibitedBy: string[];
  silencedBy: string[];
  state: "[unprocessed active suppressed]";
}

interface GrafanaAlert {
  annotations: Annotation;
  endsAt: string;
  fingerprint: string;
  generatorURL: string;
  labels: Label;
  receivers: Receiver[];
  startsAt: string;
  status: Status;
  updatedAt: string;
}

export type GrafanaGetAlertsResponse = GrafanaAlert[];

export interface GrafanaGetRulesResponse {
  status: string;
  data: {
    groups: {
      name: string;
      file: string;
      rules: {
        state: string;
        name: string;
        query: string;
        annotations: {
          [key: string]: string;
        };
        activeAt: string;
        alerts: {
          labels: {
            alertname: string;
            grafana_folder: string;
          };
          annotations: {
            [key: string]: string;
          };
          state: string;
          activeAt: string;
          value: string;
        }[];
        totals: {
          alerting: number;
        };
        totalsFiltered: {
          alerting: number;
        };
        health: string;
        type: string;
        lastEvaluation: string;
        evaluationTime: number;
      }[];
      totals: {
        firing: number;
      };
      interval: number;
      lastEvaluation: string;
      evaluationTime: number;
    }[];
    totals: {
      firing: number;
    };
  };
}
