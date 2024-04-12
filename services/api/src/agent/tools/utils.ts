import { TOOL_SOURCES_SUFFIX, TOOL_SOURCES_DIVIDER } from "./constants";

export const buildOutput = (text: string, sources?: string[]): string => {
  if (!sources) {
    return text;
  }

  const sourcesStr = buildSources(sources);
  const output = `${text} ${sourcesStr}`;
  return output;
};

export const buildSources = (sources: string[]): string => {
  const sourcesStr = sources.join(TOOL_SOURCES_DIVIDER);
  return `${TOOL_SOURCES_SUFFIX} ${sourcesStr}`;
};

export const extractSources = (output: string): string[] | undefined => {
  const parts = output.split(TOOL_SOURCES_SUFFIX);
  if (parts.length === 1) {
    return;
  }
  const metadata = parts[1];
  const data = metadata.split(TOOL_SOURCES_DIVIDER);
  return data;
};
