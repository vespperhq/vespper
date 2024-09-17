import { HumanMessage } from "langchain/schema";
import { prefix } from "./prompts";
import { ImageBlock, TextBlock } from "./types";
import { visionModel } from "./model";

/** Queries gpt-4-vision-preview, given a prompt and a base64 image */
export async function captionImage(image: string) {
  try {
    const textBlock: TextBlock = {
      type: "text",
      text: prefix.captionImage,
    };
    const imageBlock: ImageBlock = {
      type: "image_url",
      image_url: { url: image },
    };
    const newMessage = new HumanMessage({
      content: [textBlock, imageBlock],
    });
    const output = await visionModel.invoke([newMessage]);

    return output.content;
  } catch (error) {
    return error;
  }
}
