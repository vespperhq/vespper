import CallbackHandler, { Langfuse } from "langfuse-langchain";
import { v4 as uuid } from "uuid";
import { createAgent } from "./agent";
import { createTools } from "./tools";
import { AnswerContext, LLMCallbacks } from "./callbacks";
import { RunAgentParams, RunContext, RunModelParams } from "./types";
import { secretManager } from "../common/secrets";
import { buildAnswer } from "./utils";
import { Callbacks } from "langchain/callbacks";
import { isLangfuseEnabled } from "../utils/ee";

export function generateTrace(context: RunContext) {
  const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY as string,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY as string,
    baseUrl: process.env.LANGFUSE_HOST as string,
  });
  const trace = langfuse.trace({
    sessionId: context.eventId || uuid(),
  });

  const tags = Object.values(context).map((v) => String(v));
  const userId = context.userId ? context.userId : null;
  trace.update({ metadata: context, tags, userId });

  return trace;
}

export async function runModel({ model, context, messages }: RunModelParams) {
  const callbacks: Callbacks = [];
  let lfCallback: CallbackHandler | null = null;
  if (isLangfuseEnabled()) {
    lfCallback = new CallbackHandler({
      root: context.trace,
      secretKey: process.env.LANGFUSE_SECRET_KEY as string,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY as string,
      baseUrl: process.env.LANGFUSE_HOST as string,
    });
    callbacks.push(lfCallback);
  }
  const response = await model.invoke(messages, { callbacks });
  const output = response.content as string;
  const traceId = lfCallback?.getTraceId();
  const observationId = lfCallback?.getLangchainRunId();
  return { output, traceId, observationId, trace: context.trace };
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

  // Custom logic for aggregating citations and sources from tools' activations
  const answerContext = isLangfuseEnabled()
    ? new AnswerContext(context.trace)
    : new AnswerContext();
  const globalCallbacks = new LLMCallbacks(answerContext);
  const callbacks: Callbacks = [globalCallbacks];

  // Langfuse monitoring
  if (isLangfuseEnabled()) {
    callbacks.push(
      new CallbackHandler({
        root: context.trace,
        secretKey: process.env.LANGFUSE_SECRET_KEY as string,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY as string,
        baseUrl: process.env.LANGFUSE_HOST as string,
      }),
    );
  }
  const { output } = await agent.call({ input: prompt }, { callbacks });

  const answer = buildAnswer(output, answerContext.getSources());
  return { answer, answerContext };
}
