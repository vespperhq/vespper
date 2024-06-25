export const buildTraceURL = (traceId: string) => {
  const projectId = process.env.LANGFUSE_PROJECT_ID as string;
  return `https://us.cloud.langfuse.com/project/${projectId}/traces/${traceId}`;
};
