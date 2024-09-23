import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import type { JaegerIntegration } from "@vespper/db";
import { JaegerClient } from "../../../clients/jaeger";
import type { JaegerSpan, JaegerTrace } from "../../../types/vendors";
import { buildOutput } from "../utils";

interface SpanNode {
  span: JaegerSpan;
  children: SpanNode[];
}

interface SpanStatistics {
  totalSpans: number;
  totalDuration: number;
  maxDuration: number;
  minDuration: number;
  abnormalSpans: AbnormalSpan[];
}

interface AbnormalSpan extends JaegerSpan {
  parentSpanDuration: number;
  childSpanDuration: number;
  childSpanDurationPercent: number;
}

function constructSpanTree(trace: JaegerTrace): SpanNode {
  const spanMap: { [spanID: string]: SpanNode } = {};

  // Initialize span nodes
  for (const span of trace.spans) {
    spanMap[span.spanID] = { span, children: [] };
  }

  // Connect spans based on references
  for (const span of trace.spans) {
    for (const reference of span.references) {
      const parentSpan = spanMap[reference.spanID];
      if (parentSpan) {
        parentSpan.children.push(spanMap[span.spanID]);
      }
    }
  }

  // Find root spans
  const originalRootSpan: JaegerSpan = trace.spans.find(
    (span) => !span.references.length,
  )!;
  const newRootSpan: SpanNode = spanMap[originalRootSpan.spanID];

  return newRootSpan;
}

function calculateSpanStatistics(root: SpanNode): SpanStatistics {
  let totalSpans = 0;
  let totalDuration = 0;
  let maxDuration = -Infinity;
  let minDuration = Infinity;
  const abnormalSpans: AbnormalSpan[] = [];

  function traverseSpan(node: SpanNode, parentDuration: number) {
    totalSpans++;
    totalDuration += node.span.duration;
    maxDuration = Math.max(maxDuration, node.span.duration);
    minDuration = Math.min(minDuration, node.span.duration);

    const parentSpanDuration = parentDuration || node.span.duration;
    const childSpanDuration = node.span.duration;
    const childSpanDurationPercent = childSpanDuration / parentSpanDuration;

    if (childSpanDurationPercent >= 0.95 && childSpanDurationPercent < 1) {
      abnormalSpans.push({
        ...node.span,
        parentSpanDuration,
        childSpanDuration,
        childSpanDurationPercent,
      });
    }

    for (const child of node.children) {
      // TODO: hack! need to check why child.span or node.span is undefined
      if (child.span && node.span) {
        traverseSpan(child, node.span.duration);
      }
    }
  }

  traverseSpan(root, 0);

  return {
    totalSpans,
    totalDuration,
    maxDuration,
    minDuration,
    abnormalSpans,
  };
}

export default async function (integration: JaegerIntegration) {
  const { instanceUrl } = integration.metadata;
  const client = new JaegerClient(`${instanceUrl}/api`);

  return new DynamicStructuredTool({
    name: "get_longest_trace",
    description: `Get the longest trace information of a service from Jaeger`,
    func: async ({ serviceName }) => {
      try {
        const { data: traces } = await client.getTraces(serviceName, 20);
        if (!traces || !traces.length) {
          throw new Error(`Number of traces was 0 for service ${serviceName}`);
        }
        traces.sort((a, b) => {
          // Find the root spans of each trace
          const aRoot = a.spans.find(
            (span) => !span.references.length,
          )?.duration;
          const bRoot = b.spans.find(
            (span) => !span.references.length,
          )?.duration;
          if (!aRoot || !bRoot) {
            return 0;
          }
          return bRoot - aRoot;
        });

        const trace = traces[0];

        const tree = constructSpanTree(trace);
        const stats = calculateSpanStatistics(tree);

        const link = `${instanceUrl}/trace/${trace.traceID}`;
        const sources = [`[Jaeger Trace Link](${link})`];
        const output = buildOutput(JSON.stringify(stats), sources);

        return output;
      } catch (e) {
        console.trace(e);
        return `Could not fetch traces. Error: ${e}`;
      }
    },
    schema: z.object({
      serviceName: z
        .string()
        .describe("The name of the service you wish to fetch traces for."),
    }),
  });
}
