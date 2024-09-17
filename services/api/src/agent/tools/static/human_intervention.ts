import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

export default async function () {
  return Promise.resolve(
    new DynamicStructuredTool({
      name: "human_intervention",
      returnDirect: true,
      description: `This tool allows you to manually request human help, given a question.
      The question will be sent to a human expert for further assistance.`,
      func: async ({ question }) => {
        return question;
      },
      schema: z.object({
        question: z
          .string()
          .describe("The question you would like to ask the human expert."),
      }),
    }),
  );
}
