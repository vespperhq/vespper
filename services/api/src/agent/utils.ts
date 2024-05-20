import slackifyMarkdown from "slackify-markdown";

export function buildAnswer(text: string, sources?: string[], isSlack = true) {
  let answer = text;
  if (sources && sources.length) {
    const sourcesStr = sources
      .map((source) => {
        return `• ${source.trim()}\n`;
      })
      .join("\n")
      .trim();
    const sourcesSection = `\n\n*Sources :scroll:*\n${sourcesStr}`;
    answer += sourcesSection;
  }

  if (isSlack) {
    answer = slackifyMarkdown(answer);
  }
  // Add feedback section.
  // answer += `\n\n*Feedback :writing_hand:*\nHelp me be more useful! Please leave a :thumbsup: if this is helpful and :thumbsdown: if it is irrelevant.`;

  return answer;
}
