export function capitalize(text: string) {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
}

export function format(
  template: string,
  ...params: (string | number | boolean)[]
) {
  const result = params.reduce<string>(
    (total, current) => total.replace("%s", String(current)),
    template,
  );
  return result;
}
