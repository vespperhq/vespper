import {
  BaseCallbackHandler,
  BaseCallbackHandlerInput,
} from "langchain/callbacks";
import { BaseMessage } from "langchain/schema";
import { extractSources } from "./tools/utils";
import { Serialized } from "langchain/load/serializable";
import { LangfuseTraceClient } from "langfuse";

export class AnswerContext {
  private traceId: string;
  private traceURL: string;
  private observationId: string | null = null;
  private sources: string[] = [];

  constructor(trace: LangfuseTraceClient) {
    this.traceId = trace.id;
    this.traceURL = trace.getTraceUrl();
  }

  getTraceId() {
    return this.traceId;
  }

  getTraceURL() {
    return this.traceURL;
  }

  setObservationId(observationId: string) {
    this.observationId = observationId;
  }

  getObservationId() {
    return this.observationId;
  }

  getSources() {
    return this.sources;
  }

  addSource(source: string) {
    this.sources.push(source);
  }

  addSources(sources: string[]) {
    this.sources.push(...sources);
  }

  clear() {
    this.observationId = null;
    this.sources = [];
  }
}

export class LLMCallbacks extends BaseCallbackHandler {
  readonly name: string = "LLM Callbacks";
  private context: AnswerContext;

  constructor(context: AnswerContext, input?: BaseCallbackHandlerInput) {
    super(input);
    this.context = context;
  }

  override async handleToolEnd(output: string) {
    const sources = extractSources(output);
    if (sources) {
      this.context!.addSources(sources);
    }
  }

  override handleChatModelStart(
    llm: Serialized,
    messages: BaseMessage[][],
    runId: string,
  ) {
    this.context.setObservationId(runId);
  }
}
