export function flatten(
  obj: Record<string, unknown>,
  parentKey: string = "",
): Record<string, unknown> {
  let result: Record<string, unknown> = {};

  for (const key in obj) {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof obj[key] === "object" && obj[key] !== null) {
      const nestedValues = flatten(
        obj[key] as Record<string, unknown>,
        currentKey,
      );
      result = { ...result, ...nestedValues };
    } else {
      result[currentKey] = obj[key];
    }
  }

  return result;
}
