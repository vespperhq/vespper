import { DynamicTool } from "langchain/tools";

export const dummyTool = new DynamicTool({
  name: "dummy_tool",
  description: `This tool is just a placeholder tool. It doesn't do anything`,
  func: async () => {
    return "dummy tool";
  },
});
