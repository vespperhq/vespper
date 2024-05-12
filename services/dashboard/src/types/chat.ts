export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;
  };
}
export interface ChatMessage {
  role: string;
  content: string | (TextContent | ImageContent)[];
}
