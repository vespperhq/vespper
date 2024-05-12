import { useEffect, useRef, useState } from "react";
import { useGetCompletions } from "../../api/queries/chat";
import { ChatMessage } from "../../types/chat";
import { Message } from "./Message";
import { Box, IconButton, Input } from "@mui/joy";
import SendIcon from "@mui/icons-material/Send";
import { useColorScheme } from "@mui/joy/styles";

export function Chat() {
  const { mode } = useColorScheme();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { mutateAsync: getCompletion } = useGetCompletions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = () => {
    setInput("");
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);

    getCompletion(newMessages).then(({ output }) => {
      setMessages([...newMessages, { role: "assistant", content: output }]);
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const inputDisabled = input === "" || input === " ";
  return (
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      height="100%"
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="60%"
      >
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
      </Box>
      <div ref={messagesEndRef} />
      <Box
        sx={{
          width: "60%",
          position: "sticky",
          bottom: "0",
          left: "0",
          right: "0",
          margin: "0 auto",
          paddingBottom: "20px",
          backgroundColor: mode === "light" ? "white" : "black",
        }}
      >
        <Box position="relative">
          <Input
            placeholder="Message Merlinn"
            value={input}
            onChange={handleInputChange}
            onKeyUp={({ key }) => {
              if (input === "") {
                return;
              } else if (key !== "Enter") {
                return;
              }
              handleSubmit();
            }}
          />
          <IconButton
            disabled={inputDisabled}
            variant="plain"
            size="sm"
            sx={{
              position: "absolute",
              right: "0",
              top: "0",
              bottom: "0",
              margin: "auto",
            }}
            onClick={handleSubmit}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
