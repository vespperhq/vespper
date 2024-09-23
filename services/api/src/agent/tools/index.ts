import type {
  CoralogixIntegration,
  DataDogIntegration,
  GithubIntegration,
  IIntegration,
  JaegerIntegration,
  PrometheusIntegration,
  MongoDBIntegration,
} from "@vespper/db";
import { toolLoaders as coralogixToolLoaders } from "./coralogix";
import { toolLoaders as githubToolLoaders } from "./github";
import { toolLoaders as datadogToolLoaders } from "./datadog";
import { createToolLoaders as createStaticToolLoaders } from "./static";
import { toolLoaders as mongodbToolLoaders } from "./mongodb";
import { toolLoaders as jaegerToolLoaders } from "./jaeger";
import { toolLoaders as prometheusToolLoaders } from "./prometheus";
import { Tool, ToolLoader } from "./types";
import { RunContext } from "../types";
import { dummyTool } from "./dummy";

export const compileTools = async <T extends IIntegration>(
  toolLoaders: ToolLoader<T>[],
  integration: T,
  context: RunContext,
): Promise<Tool[]> => {
  const tools = await Promise.all(
    toolLoaders.map((loader) => loader(integration, context)),
  );
  return tools;
};

export const createToolsForVendor = async <T extends IIntegration>(
  integrations: IIntegration[],
  vendor: string,
  toolLoaders: ToolLoader<T>[],
  context: RunContext,
) => {
  const tools = [] as Tool[];

  const integration = integrations.find(
    (integration) => integration.vendor.name === vendor,
  );
  if (integration) {
    const vendorTools = await compileTools<T>(
      toolLoaders,
      integration as T,
      context,
    );
    tools.push(...vendorTools);
  }

  return tools;
};

export const createTools = async (
  integrations: IIntegration[],
  context: RunContext,
) => {
  const tools = [] as Tool[];

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
      context,
    ),
    createToolsForVendor<GithubIntegration>(
      integrations,
      "Github",
      githubToolLoaders,
      context,
    ),
    createToolsForVendor<DataDogIntegration>(
      integrations,
      "DataDog",
      datadogToolLoaders,
      context,
    ),
    createToolsForVendor<MongoDBIntegration>(
      integrations,
      "MongoDB",
      mongodbToolLoaders,
      context,
    ),
    createToolsForVendor<JaegerIntegration>(
      integrations,
      "Jaeger",
      jaegerToolLoaders,
      context,
    ),
    createToolsForVendor<PrometheusIntegration>(
      integrations,
      "Prometheus",
      prometheusToolLoaders,
      context,
    ),
  ]);

  // Static tools
  const staticToolLoaders = await createStaticToolLoaders(context);
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

  // In case the user hasn't configured any integrations yet, we add a dummy tool.
  // This hack is needed because OpenAI expects to receive at least 1 tool.
  // TODO: Need to find a better way to handle this.
  if (tools.length === 0) {
    tools.push(dummyTool);
  }

  return tools;
};
