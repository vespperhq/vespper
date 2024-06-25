import { CoralogixDomain } from "../../types";

// Coralogix Endpoints & Domains. For more information, visit:
// https://coralogix.com/docs/coralogix-endpoints/
export const domains: Record<string, CoralogixDomain> = {
  management: {
    EU1: {
      domain: "coralogix.com",
      region: "eu-west-1",
      description: "[EU1 – Ireland]",
      apiURL: "https://ng-api-http.coralogix.com/api/v1/dataprime/query",
    },
    AP1: {
      domain: "coralogix.in",
      region: "ap-south1",
      description: "[AP1 – India]",
      apiURL: "https://ng-api-http.app.coralogix.in/api/v1/dataprime/query",
    },
    US1: {
      domain: "coralogix.us",
      region: "us-east2",
      description: "[US1 – Ohio]",
      apiURL: "https://ng-api-http.coralogix.us/api/v1/dataprime/query",
    },
    EU2: {
      domain: "eu2.coralogix.com",
      region: "eu-north-1",
      description: "[EU2 – Stockholm]",
      apiURL: "https://ng-api-http.eu2.coralogix.com/api/v1/dataprime/query",
    },
    AP2: {
      domain: "coralogixsg.com",
      region: "ap-southeast-1",
      description: "[AP2 – Singapore]",
      apiURL: "https://ng-api-http.coralogixsg.com/api/v1/dataprime/query",
    },
    US2: {
      domain: "cx498.coralogix.com",
      region: "us-west-2",
      description: "[US2 – Oregon]",
      apiURL: "https://ng-api-http.cx498.coralogix.com/api/v1/dataprime/query",
    },
  },
  externalAlerts: {
    EU1: {
      domain: "coralogix.com",
      region: "eu-west-1",
      description: "[EU1 – Ireland]",
      apiURL: "https://api.coralogix.com/api/v1/external/alerts",
    },
    AP1: {
      domain: "coralogix.in",
      region: "ap-south1",
      description: "[AP1 – India]",
      apiURL: "https://api.coralogix.in/api/v1/external/alerts",
    },
    US1: {
      domain: "coralogix.us",
      region: "us-east2",
      description: "[US1 – Ohio]",
      apiURL: "https://api.coralogix.us/api/v1/external/alerts",
    },
    EU2: {
      domain: "eu2.coralogix.com",
      region: "eu-north-1",
      description: "[EU2 – Stockholm]",
      apiURL: "https://api.eu2.coralogix.com/api/v1/external/alerts",
    },
    AP2: {
      domain: "coralogixsg.com",
      region: "ap-southeast-1",
      description: "[AP2 – Singapore]",
      apiURL: "https://api.coralogixsg.com/api/v1/external/alerts",
    },
    US2: {
      domain: "cx498.coralogix.com",
      region: "us-west-2",
      description: "[US2 – Oregon]",
      apiURL: "https://api.cx498.coralogix.com/api/v1/external/alerts",
    },
  },
};
