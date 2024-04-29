import { JaegerTrace, JaegerSpan } from "../src/types/vendors";
// import traceData from "./trace.json";

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
export function constructSpanTree(trace: JaegerTrace): SpanNode {
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

export function calculateSpanStatistics(root: SpanNode): SpanStatistics {
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

    if (childSpanDurationPercent >= 0.9) {
      abnormalSpans.push({
        ...node.span,
        parentSpanDuration,
        childSpanDuration,
        childSpanDurationPercent,
      });
    }

    for (const child of node.children) {
      traverseSpan(child, node.span.duration);
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

// const tree = constructSpanTree(traceData);
// const stats = calculateSpanStatistics(tree);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

console.log(stats);
