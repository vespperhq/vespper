import type {
  CoralogixIntegration,
  DataDogIntegration,
  GithubIntegration,
  IIntegration,
  JaegerIntegration,
  PrometheusIntegration,
  MongoDBIntegration,
} from "@merlinn/db";
import { toolLoaders as coralogixToolLoaders } from "./coralogix";
import { toolLoaders as githubToolLoaders } from "./github";
import { toolLoaders as datadogToolLoaders } from "./datadog";
import { toolLoaders as staticToolLoaders } from "./static";
import { toolLoaders as mongodbToolLoaders } from "./mongodb";
import { toolLoaders as jaegerToolLoaders } from "./jaeger";
import { toolLoaders as prometheusToolLoaders } from "./prometheus";
import { Tool } from "./types";
import { RunContext } from "../types";

type ToolLoader<T extends IIntegration> = (integration: T) => Promise<Tool>;

export const compileTools = async <T extends IIntegration>(
  toolLoaders: ToolLoader<T>[],
  integration: T,
): Promise<Tool[]> => {
  const tools = await Promise.all(
    toolLoaders.map((loader) => loader(integration)),
  );
  return tools;
};

export const createToolsForVendor = async <T extends IIntegration>(
  integrations: IIntegration[],
  vendor: string,
  toolLoaders: ToolLoader<T>[],
) => {
  const tools = [] as Tool[];

  const integration = integrations.find(
    (integration) => integration.vendor.name === vendor,
  );
  if (integration) {
    const vendorTools = await compileTools<T>(toolLoaders, integration as T);
    tools.push(...vendorTools);
  }

  return tools;
};

export const createTools = async (
  integrations: IIntegration[],
  context: RunContext,
) => {
  const tools = [] as Tool[];

  // Coralogix
  const [
    coralogixTools,
    githubTools,
    datadogTools,
    mongodbTools,
    jaegerTools,
    prometheusTools,
  ] = await Promise.all([
    createToolsForVendor<CoralogixIntegration>(
      integrations,
      "Coralogix",
      coralogixToolLoaders,
    ),
    createToolsForVendor<GithubIntegration>(
      integrations,
      "Github",
      githubToolLoaders,
    ),
    createToolsForVendor<DataDogIntegration>(
      integrations,
      "DataDog",
      datadogToolLoaders,
    ),
    createToolsForVendor<MongoDBIntegration>(
      integrations,
      "MongoDB",
      mongodbToolLoaders,
    ),
    createToolsForVendor<JaegerIntegration>(
      integrations,
      "Jaeger",
      jaegerToolLoaders,
    ),
    createToolsForVendor<PrometheusIntegration>(
      integrations,
      "Prometheus",
      prometheusToolLoaders,
    ),
  ]);

  // Static tools
  const staticTools = await Promise.all(
    staticToolLoaders.map((loader) => loader(context)),
  );

  // Add all the tools
  tools.push(
    ...coralogixTools,
    ...githubTools,
    ...datadogTools,
    ...mongodbTools,
    ...jaegerTools,
    ...prometheusTools,
    ...staticTools,
  );

  return tools;
};
