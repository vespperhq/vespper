import { CodeBlock } from "react-code-block";

interface Props {
  code: string;
  language: string;
}
export function CodeBlockDemo({ code, language }: Props) {
  return (
    <CodeBlock code={code} language={language}>
      <CodeBlock.Code>
        <CodeBlock.LineContent>
          <CodeBlock.Token />
        </CodeBlock.LineContent>
      </CodeBlock.Code>
    </CodeBlock>
  );
}
