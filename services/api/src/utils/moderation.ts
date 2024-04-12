import { OpenAIModerationChain } from "langchain/chains";

export const validateModeration = async (input: string) => {
  const moderation = new OpenAIModerationChain();

  const { results } = await moderation.call({
    input,
  });

  if (results?.[0]?.flagged) {
    return false;
  }

  let flag = true;

  Object.values(
    results?.[0]?.category_scores as Record<string, number>,
  ).forEach((value: number) => {
    if (value > 0.01) {
      flag = false;
    }
  });

  return flag;
};
