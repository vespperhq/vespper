import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { PromptTemplate } from "langchain/prompts";
import { CoralogixIntegration } from "@merlinn/db";
import { DATAPRIME_CHEATSHEET } from "./constants";
import {
  filterHighCardinalityFields,
  getCommonLogFields,
  getCommonLogValues,
  getPrettyLogAnalysis,
  getPrettyLogSample,
  getQueriesHistory,
  limitLogs,
} from "./utils";
import { buildOutput } from "../utils";
import { JsonOutputParser } from "langchain/schema/output_parser";
import { chatModel } from "../../../agent/model";
import {
  getTimestamp,
  Timeframe,
  timeframe2values,
} from "../../../utils/dates";
import { RunContext } from "../../../agent/types";

// const TEMP_COMMONG_TAGS = `
// Here are the common fields that you can use in your query (they were taken from the environment itself):\n

// resource.attributes.cloud_account_id, resource.attributes.cloud_availability_zone, resource.attributes.cloud_platform, resource.attributes.cloud_provider, resource.attributes.cloud_region, resource.attributes.cx_otel_integration_name, resource.attributes.host_id, resource.attributes.host_image_id, resource.attributes.host_name, resource.attributes.host_type, resource.attributes.k8s_cluster_name, resource.attributes.k8s_container_name, resource.attributes.k8s_container_restart_count, resource.attributes.k8s_deployment_name, resource.attributes.k8s_namespace_name, resource.attributes.k8s_node_name, resource.attributes.k8s_pod_name, resource.attributes.k8s_pod_uid, resource.attributes.os_type, resourceSchemaUrl, attributes.cluster_name, attributes.log_file_path, attributes.log_iostream, attributes.logtag, attributes.time, observedTimeUnixNano, timeUnixNano, date, level, service, controller, threadId, caller, message, status, time, url, method, requestAborted, tenantId, userId, correlationId, clientIp, platform, body, PRIORITY, SYSLOG_FACILITY, _UID, _GID, _CAP_EFFECTIVE, _BOOT_ID, _MACHINE_ID, _HOSTNAME, _RUNTIME_SCOPE, _SYSTEMD_SLICE, _TRANSPORT, _STREAM_ID, SYSLOG_IDENTIFIER, _PID, _COMM, _EXE, _CMDLINE, _SELINUX_CONTEXT, _SYSTEMD_CGROUP, _SYSTEMD_UNIT, _SYSTEMD_INVOCATION_ID, MESSAGE, exception, errorType, DeviceId, PatchProperties, FieldKey, AttemptedDefaultValue, FieldType, Query, connectorId, connectorGroupNfId, connectorsCount, zitiConnectorsCount, @timestamp, msg, run_time, source, name, id, AuthenticationScheme, EventId, EventName, DbContextType, fileName, queryId, connectionOpenedTime, queryExecutionTime, queryReadResultsTime, timezoneSetTime, records, ApplicationGroupId, RequestSignature, RequestUrl, startTime, categoryName, level.level, level.levelStr, level.colour, context.TENANT, context.DOCID, context.USERID, pid, query, endTime, limit, parameters, FailureMessage, applicationId, connectionType, duration, httpVersion, isConnectivityCheck, requestedHost, routeId, routeProvider, statusCode, uri, userAgent\n\n
// `;

// const TEMP_LOG_SAMPLE = `
// resource.attributes.cloud_account_id: 636375568718\nresource.attributes.cloud_availability_zone: us-east-1c\nresource.attributes.cloud_platform: aws_ec2\nresource.attributes.cloud_provider: aws\nresource.attributes.cloud_region: us-east-1\nresource.attributes.cx_otel_integration_name: coralogix-integration-helm\nresource.attributes.host_id: i-0c74fd375858e256b\nresource.attributes.host_image_id: ami-065265c6ca4531afa\nresource.attributes.host_name: ip-10-21-70-83.ec2.internal\nresource.attributes.host_type: m6g.xlarge\nresource.attributes.k8s_cluster_name: staging-us-east-1\nresource.attributes.k8s_container_name: identity\nresource.attributes.k8s_container_restart_count: 0\nresource.attributes.k8s_deployment_name: identity\nresource.attributes.k8s_namespace_name: dev-0\nresource.attributes.k8s_node_name: ip-10-21-70-83.ec2.internal\nresource.attributes.k8s_pod_name: identity-d4f8c7575-9msqp\nresource.attributes.k8s_pod_uid: 695421c8-e8ca-473e-ad7f-bb0cb0942a46\nresource.attributes.os_type: linux\nresourceSchemaUrl: https://opentelemetry.io/schemas/1.6.1\nattributes.cluster_name: staging-us-east-1\nattributes.log_file_path: /var/log/pods/dev-0_identity-d4f8c7575-9msqp_695421c8-e8ca-473e-ad7f-bb0cb0942a46/identity/0.log\nattributes.log_iostream: stdout\nattributes.logtag: F\nattributes.time: 2024-08-28T12:59:58.578342483Z\nobservedTimeUnixNano: 1724849998635745800\ntimeUnixNano: 1724849998578342400\ndate: 2024-08-28 12:59:58.5742\nlevel: INFO\nservice: Identity\ncontroller: InternalUsersData\nthreadId: 11\ncaller: ExecutionContext.RunInternal\nmessage: Request => Status: 200, Time: 4ms, Url: "http://identity/internal/api/v1/InternalUsersData?userIds=auth0%7C66cea1b652764c475e7d1d1c&userType=1", Method: "GET", tenantId: "automation-118f4063-bc6b-4e4f-92a6-b18e8adf78c4", userId: "auth0|66cea1b5b822319b3984c3ce", requestAborted: false\nstatus: 200\ntime: 4\nurl: http://identity/internal/api/v1/InternalUsersData?userIds=auth0%7C66cea1b652764c475e7d1d1c&userType=1\nmethod: GET\nrequestAborted: false\ntenantId: automation-118f4063-bc6b-4e4f-92a6-b18e8adf78c4\nuserId: auth0|66cea1b5b822319b3984c3ce\ncorrelationId: e0ab7c2a-e5d3-4f51-9c6b-1fc14d8f5028\nclientIp: 10.21.52.41\nplatform: Browser\n\n--------------------------------------\n\nresource.attributes.cloud_account_id: 636375568718\nresource.attributes.cloud_availability_zone: us-east-1a\nresource.attributes.cloud_platform: aws_ec2\nresource.attributes.cloud_provider: aws\nresource.attributes.cloud_region: us-east-1\nresource.attributes.cx_otel_integration_name: coralogix-integration-helm\nresource.attributes.host_id: i-0d1f249ffc6cb2286\nresource.attributes.host_image_id: ami-065265c6ca4531afa\nresource.attributes.host_name: ip-10-21-18-97.ec2.internal\nresource.attributes.host_type: m6g.xlarge\nresource.attributes.k8s_cluster_name: staging-us-east-1\nresource.attributes.k8s_container_name: extensions\nresource.attributes.k8s_container_restart_count: 0\nresource.attributes.k8s_deployment_name: extensions\nresource.attributes.k8s_namespace_name: default\nresource.attributes.k8s_node_name: ip-10-21-18-97.ec2.internal\nresource.attributes.k8s_pod_name: extensions-b8cbd7c88-gm8fg\nresource.attributes.k8s_pod_uid: c0d415e8-ce20-445b-bebc-a4e812fa185b\nresource.attributes.os_type: linux\nresourceSchemaUrl: https://opentelemetry.io/schemas/1.6.1\nattributes.cluster_name: staging-us-east-1\nattributes.log_file_path: /var/log/pods/default_extensions-b8cbd7c88-gm8fg_c0d415e8-ce20-445b-bebc-a4e812fa185b/extensions/0.log\nattributes.log_iostream: stdout\nattributes.logtag: F\nattributes.time: 2024-08-28T12:59:58.895803912Z\nobservedTimeUnixNano: 1724849999077313500\ntimeUnixNano: 1724849998895804000\ndate: 2024-08-28 12:59:58.8879\nlevel: DEBUG\nservice: Extensions\nthreadId: 40\ncaller: ExecutionContext.RunInternal\nmessage: Metadata or package entity not found, skipping risk calculation for now
// `;

const PROMPT_TEMPLATE = `
You are a Coralogix logs expert. Given a request in natural language, you should generate {nQueries} queries in a DataPrime syntax.
DataPrime is Coralogix's proprietary query language that allows you to query logs in a more structured way.

Here is a cheatsheet of DataPrime query language:
{cheatsheet}

Here are the common fields that you can use in your query (they were taken from the environment itself):
{commonFields}

Here are the common values that you can use in your query (they were taken from the environment itself):
{commonValues}

Here is a sample of logs so you'd know how they look like:
{logSample}

Here is a sample of queries that the team has already used (can be really useful! in most cases, you should use them as a reference):
{queriesHistory}

You should return your answer as a block of Thought, Observation and Answer.
The thought section should contain a thought that you have about the request.
The observation section should contain an observation on log sample/cheatsheet/common fields.
The answer section should contain a JSON with only one key called "queries", and it should be a list of valid DataPrime queries.

For instance, given the following logSample + request:

Log sample
resource.attributes.service.name: recommendationservice
logRecord.severityText: WARN
logRecord.body: Receive ListRecommendations for product ids:['OLJCESPC7Z', 'L9ECAV7KIM', '66VCHSJNUP', '6E92ZMYYFZ', 'LS4PSXUNUM']

Request:
"Please fetch all the warning logs for the recommendationservice"

Your answer should be as follows:
Thought: I think that the request is asking for logs with a specific severity level for a specific service, in this case, the "recommendationservice".
Observation: The log sample contains the service name and the severity level. The fields are called "resource.attributes.service.name" and "logRecord.severityText".
Answer:
\`\`\`json
{{"queries": ["source logs | filter resource.attributes.service.name == 'recommendationservice' && logRecord.severityText == 'WARN'"]}}
\`\`\`

Please create variations of the queries to cover more ground. Try to make some of them wider and some of them more specific.
Start from the service level and then go deeper into the logs.

IMPORTANT! Always look at the log sample and the common fields to understand the structure of the logs, so your queries are valid.
IMPORTANT! Don't include timestamp filters. We add them in the metadata of the query, not in the query itself.

Begin!

{request}
`;

const TOOL_DESCRIPTION = `
This tool serves as a Coralogix logs expert. Given a request in plain english, it will try to find the relevant logs.
Here are some examples that you can use:
- Please fetch the logs for the last 24 hours of service X
- Can you fetch the logs for service Y from the production environment?
`;

export default async function (
  integration: CoralogixIntegration,
  context: RunContext,
) {
  console.log(context);

  const { logsKey } = integration.credentials;
  const { region, domainURL } = integration.metadata;

  return new DynamicStructuredTool({
    name: "logs_expert_tool",
    description: TOOL_DESCRIPTION,
    func: async ({ request, timeframe }) => {
      try {
        const logSample = await getPrettyLogSample(logsKey, region, 2);
        const commonFields = await getCommonLogFields(logsKey, region);
        const filteredFields = await filterHighCardinalityFields(logSample);
        const queriesHistory = await getQueriesHistory(integration);

        const commonValues = await getCommonLogValues(
          filteredFields,
          logsKey,
          region,
          20,
        );

        const prettyCommonFields = commonFields.join("\n");
        const prettyCommonValues = Object.entries(commonValues)
          .map(([key, value]) => `${key}: ${value.join(", ")}`)
          .join("\n");
        const prettyQueriesHistory = queriesHistory.join("\n");

        const prompt = await PromptTemplate.fromTemplate(
          PROMPT_TEMPLATE,
        ).format({
          nQueries: 3,
          cheatsheet: DATAPRIME_CHEATSHEET,
          commonFields: prettyCommonFields,
          commonValues: prettyCommonValues,
          queriesHistory: prettyQueriesHistory,
          logSample: logSample,
          request,
        });

        const parser = new JsonOutputParser();
        const { content } = await chatModel.invoke(prompt);
        const { queries } = await parser.parse(content as string);
        if (!queries || queries.length === 0) {
          throw new Error("No queries generated");
        }

        const [amount, scale] = timeframe2values[timeframe];
        const startDate = getTimestamp({ amount, scale });
        const endDate = new Date().toISOString();
        const results = (
          await Promise.all(
            queries.map(async (query: string) => {
              try {
                const { analysis, parsedLogs } = await getPrettyLogAnalysis({
                  query,
                  integration,
                  timeframe,
                });

                if (
                  !parsedLogs.result?.results ||
                  parsedLogs.result?.results.length === 0
                ) {
                  return `Coraloigx returned empty result. Information: ${JSON.stringify(
                    parsedLogs,
                  )}`;
                }

                if (!analysis) {
                  const logsStr = limitLogs(JSON.stringify(parsedLogs));
                  const output = `
                  Here are the log results for query: ${query}
                  ${logsStr}
                  `;
                  return output;
                }

                const output = `
                Here is a log analysis for query: ${query}
                Analysis:
                ${analysis}
                `;
                return output;
              } catch (error) {
                return null;
              }
            }),
          )
        )
          .filter(Boolean)
          .reduce(
            (acc, val, index) => {
              acc.queries.push(queries[index]);
              acc.results.push(val);
              return acc;
            },
            { queries: [], results: [] },
          );

        const sources = results.queries.map((query: string) => {
          const link = `${domainURL}/#/query-new/logs?query=${encodeURIComponent(
            query,
          )}&time=from:${startDate},to:${endDate}&page=0&querySyntax=dataprime&permalink=true`;
          return `[Coralogix Logs Link](${link})`;
        });

        const analyses = results.results;
        const logsStr = JSON.stringify(analyses).slice(0, 10000);
        const output = buildOutput(logsStr, sources);

        return output;
      } catch (error) {
        console.error(error);
        return JSON.stringify(error);
      }
    },
    schema: z.object({
      request: z.string().describe("The request to be used with Coralogix."),
      timeframe: z
        .enum([
          Timeframe.Last1Minute,
          Timeframe.Last2Minutes,
          Timeframe.Last5Minutes,
          Timeframe.Last15Minutes,
          Timeframe.Last30Minutes,
          Timeframe.Last1Hour,
          Timeframe.Last2Hours,
          Timeframe.Last6Hours,
          Timeframe.Last12Hours,
          Timeframe.Last24Hours,
          Timeframe.Last2Days,
          Timeframe.Last3Days,
          Timeframe.Last5Days,
          Timeframe.Last7Days,
        ])
        .describe(
          "The period for which you wish to search the logs. Default is last 24 hours.",
        )
        .default(Timeframe.Last24Hours),
    }),
  });
}
