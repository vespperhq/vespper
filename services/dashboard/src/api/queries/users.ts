import { useMutation, useQuery } from "@tanstack/react-query";
import { useAxios } from "../hooks";
import { deleteUser, getOrgUsers } from "../calls/users";

export const useOrgUsers = (organizationId: string | undefined) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ["orgUsers"],
    queryFn: async () => getOrgUsers(axios, organizationId!),
    enabled: !!organizationId,
  });
};

export const useDeleteUser = () => {
  const axios = useAxios();
  return useMutation({
    mutationKey: ["deleteUser"],
    mutationFn: async (id: string) => deleteUser(axios, id),
  });
};
