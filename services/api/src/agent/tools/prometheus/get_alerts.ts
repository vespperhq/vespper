import { DynamicTool } from "langchain/tools";
import type { PrometheusIntegration } from "@merlinn/db";
import { PrometheusDriver } from "prometheus-query";

export default async function (integration: PrometheusIntegration) {
  const { username, password } = integration.credentials;
  const { instanceUrl } = integration.metadata;

  const client = new PrometheusDriver({
    endpoint: `${instanceUrl}/api/v1`,
    auth: {
      username,
      password,
    },
  });

  return new DynamicTool({
    name: "get_prometheus_active_alerts",
    description: `Get the active alerts from Prometheus.`,
    func: async () => {
      try {
        const alerts = await client.alerts();
        return JSON.stringify(alerts);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return JSON.stringify(error);
      }
    },
  });
}
