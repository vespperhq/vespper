import {
  BaseCallbackHandler,
  BaseCallbackHandlerInput,
} from "langchain/callbacks";
import { BaseMessage, LLMResult } from "langchain/schema";
import { extractSources } from "./tools/utils";
import { buildAnswer } from "./utils";
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

export type AnswerHandler = (
  text: string,
  context: AnswerContext,
) => Promise<void>;
export class LLMCallbacks extends BaseCallbackHandler {
  readonly name: string = "LLM Callbacks";
  private context: AnswerContext;
  private onAnswer: AnswerHandler;

  constructor(
    onAnswer: AnswerHandler,
    trace: LangfuseTraceClient,
    input?: BaseCallbackHandlerInput,
  ) {
    super(input);
    this.onAnswer = onAnswer;
    this.context = new AnswerContext(trace);
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

  override async handleLLMEnd(output: LLMResult) {
    const { text } = output.generations[0][0];
    if (text) {
      // Check & add sources section
      let answer;
      if (this.context!.getSources().length > 0) {
        answer = buildAnswer(text, this.context!.getSources());
      } else {
        answer = buildAnswer(text);
      }

      await this.onAnswer(answer, this.context);

      // Clear context
      this.context!.clear();
    }
  }
}
