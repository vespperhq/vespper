import CallbackHandler from "langfuse-langchain";
import { v4 as uuid } from "uuid";
import { createAgent } from "./agent";
import { createTools } from "./tools";
import { AnswerContext, LLMCallbacks } from "./callbacks";
import { langfuse } from "../clients/langfuse";
import { RunAgentParams, RunContext, RunModelParams } from "./types";
import { secretManager } from "../common/secrets";
import { buildAnswer } from "./utils";

function generateTrace(context: RunContext) {
  const trace = langfuse.trace({
    sessionId: context.eventId || uuid(),
  });

  const tags = Object.values(context).map((v) => String(v));
  const userId = context.userId ? context.userId : null;
  trace.update({ metadata: context, tags, userId });

  return trace;
}

function generateLFCallback(context: RunContext) {
  const trace = generateTrace(context);
  const callback = new CallbackHandler({
    root: trace,
    secretKey: process.env.LANGFUSE_SECRET_KEY as string,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY as string,
    baseUrl: process.env.LANGFUSE_HOST as string,
  });

  return { callback, trace };
}

export async function runModel({ model, context, messages }: RunModelParams) {
  const { callback, trace } = generateLFCallback(context);
  const response = await model.invoke(messages, { callbacks: [callback] });
  const output = response.content as string;
  const traceId = callback.getTraceId();
  const observationId = callback.getLangchainRunId();
  return { output, traceId, observationId, trace };
}

export async function runAgent({
  prompt,
  model,
  template,
  integrations,
  context,
  messages,
}: RunAgentParams) {
  const populatedIntegrations =
    await secretManager.populateCredentials(integrations);

  const tools = await createTools(populatedIntegrations, context);
  const agent = await createAgent(tools, model, template, messages);

  // Langfuse monitoring
  const { callback: langfuseCallbacks, trace } = generateLFCallback(context);

  // Custom logic for aggregating citations and sources from tools' activations
  const answerContext = new AnswerContext(trace);
  const globalCallbacks = new LLMCallbacks(answerContext);

  const callbacks = [langfuseCallbacks, globalCallbacks];
  const { output } = await agent.call({ input: prompt }, { callbacks });

  const answer = buildAnswer(output, answerContext.getSources());
  return { answer, answerContext };
}
