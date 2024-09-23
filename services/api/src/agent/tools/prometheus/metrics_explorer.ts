import axios from "axios";
import { DynamicTool } from "langchain/tools";
import type { PrometheusIntegration } from "@vespper/db";

export default async function (integration: PrometheusIntegration) {
  return new DynamicTool({
    name: "prometheus_metrics_explorer",
    description: `Explore metrics from the Prometheus instance.`,
    func: async () => {
      try {
        const { username, password } = integration.credentials;
        const { instanceUrl } = integration.metadata;

        const {
          data: { data: metrics },
        } = await axios.get(`${instanceUrl}/api/v1/label/__name__/values`, {
          auth: {
            username,
            password,
          },
        });

        return JSON.stringify(metrics);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return JSON.stringify(error);
      }
    },
  });
}
