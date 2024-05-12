import { useMutation } from "@tanstack/react-query";
import { useAxios } from "../hooks";
import { ChatMessage } from "../../types/chat";
import { getCompletion } from "../calls/chat";

export const useGetCompletions = () => {
  const axios = useAxios();

  return useMutation({
    mutationFn: async (messages: ChatMessage[]) => {
      return getCompletion(axios, { messages });
    },
  });
};
