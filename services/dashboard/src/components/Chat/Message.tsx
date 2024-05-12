import { Avatar, Box, Typography } from "@mui/joy";
import { ChatMessage } from "../../types/chat";
import { useAuth0 } from "@auth0/auth0-react";
import LogoImage from "../../assets/logo-wizard.svg";
import Markdown from "react-markdown";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  message: ChatMessage;
}

const getInitials = (text: string) => {
  const words = text.split(" ");
  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  return `${firstWord[0].toUpperCase()}${lastWord[0].toUpperCase()}`;
};

export function Message({ message }: Props) {
  const { user } = useAuth0();
  const text = message.content as string;
  const role = message.role;
  const isBot = role === "assistant";

  return (
    <Box display="flex" py={4} width="100%">
      <Avatar size="sm" src={isBot ? LogoImage : undefined} sx={{ mr: 2 }}>
        {getInitials(user!.name!)}
      </Avatar>
      <Box display="flex" flexDirection="column">
        <Typography level="title-md">{isBot ? "Merlinn" : "You"}</Typography>
        {!isBot ? (
          <Typography level="body-md">{text}</Typography>
        ) : (
          <div style={{ marginTop: "-15px" }}>
            <Markdown
              children={text}
              //   components={{
              //     code(props) {
              //       const { children, className, ...rest } = props;
              //       //   const match = /language-(\w+)/.exec(className || "");

              //       const lines = children?.toString().split("\n");
              //       const code = lines?.slice(1, lines.length - 2).join("\n");
              //       const language = children?.toString().slice(3).split("\n")[0];
              //       return language ? (
              //         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //         // @ts-ignore
              //         <SyntaxHighlighter
              //           {...rest}
              //           PreTag="div"
              //           children={code as string}
              //           language={language}
              //           style={dark}
              //         />
              //       ) : (
              //         <code {...rest} className={className}>
              //           {children}
              //         </code>
              //       );
              //     },
              //   }}
            />
          </div>
        )}
      </Box>
    </Box>
  );
}
