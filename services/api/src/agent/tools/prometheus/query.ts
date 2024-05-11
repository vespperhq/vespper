import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import type { PrometheusIntegration } from "@merlinn/db";
import { PrometheusDriver } from "prometheus-query";

export default async function (integration: PrometheusIntegration) {
  const { username, password } = integration.credentials;
  const { instanceUrl } = integration.metadata;

  const client = new PrometheusDriver({
    endpoint: instanceUrl,
    baseURL: "/api/v1",
    auth: {
      username,
      password,
    },
  });

  return new DynamicStructuredTool({
    name: "query_prometheus",
    description: "Perform an instant query over Prometheus using PromQL",
    func: async ({ query }) => {
      try {
        const response = await client.instantQuery(query);
        const series = response.result.map((serie) => ({
          Serie: serie.metric.toString(),
          Time: serie.value.time,
          Value: serie.value.value,
        }));
        return JSON.stringify(series);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return JSON.stringify(error);
      }
    },
    schema: z.object({
      query: z.string().describe(`The PromQL query you wish to execute.`),
    }),
  });
}
