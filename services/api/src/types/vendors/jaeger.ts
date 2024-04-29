interface JaegerTag {
  key: string;
  type: "string" | "int64";
  value: string;
}

export interface JaegerSpan {
  traceID: string;
  spanID: string;
  operationName: string;
  startTime: number;
  duration: number;
  references: [
    {
      refType: "CHILD_OF";
      traceID: string;
      spanID: string;
    },
  ];
  tags: JaegerTag[];
}

export interface JaegerTrace {
  traceID: string;
  spans: JaegerSpan[];
  warnings: string;
}

export interface JaegerAPIResponse<T> {
  data: T;
  total: number;
  limit: number;
  offset: number;
  errors: string;
}
