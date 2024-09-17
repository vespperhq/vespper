export function replaceSuccessiveQuotes(input: string): string {
  return input.replace(/''+/g, "'").replace(/""+/g, '"');
}

export function isURL(input: string) {
  try {
    new URL(input);
    return true;
  } catch (e) {
    return false;
  }
}
