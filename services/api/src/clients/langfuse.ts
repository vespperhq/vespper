import { Langfuse } from "langfuse";

export const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY as string,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY as string,
  baseUrl: process.env.LANGFUSE_HOST as string,
});

export const buildTraceURL = (traceId: string) => {
  const projectId = process.env.LANGFUSE_PROJECT_ID as string;
  return `https://us.cloud.langfuse.com/project/${projectId}/traces/${traceId}`;
};
