export const isProd = process.env.NODE_ENV === "production";
export const isTelemetryEnabled = () =>
  process.env.TELEMETRY_ENABLED === "true";
