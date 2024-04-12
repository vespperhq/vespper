import { useMutation, useQuery } from "@tanstack/react-query";
import { useAxios } from "../hooks";
import { importOpsgenieUsers, inviteUsers } from "../calls/invite";

export const useImportOpsgenieUsers = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ["importUsers"],
    queryFn: async () => importOpsgenieUsers(axios),
    enabled: false,
  });
};

export const useInviteUsers = () => {
  const axios = useAxios();
  return useMutation({
    mutationKey: ["inviteUser"],
    mutationFn: async (emails: string[]) => inviteUsers(axios, emails),
  });
};
