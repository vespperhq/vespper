import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getIntegrations, deleteIntegration } from "../calls/integrations";
import { useAxios } from "../hooks";
import { ConnectionType } from "../../types/Connections";

export const useIntegrations = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: [ConnectionType.Integration],
    queryFn: () => getIntegrations(axios),
  });
};

interface ConnectRequest {
  url?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
}

export const useCreateIntegration = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: ConnectRequest) => {
      await axios.post(requestData.url!, requestData.body, requestData.config);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await new Promise((resolve: any) => setTimeout(resolve, 5000));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ConnectionType.Integration] });
    },
  });
};

export const useDeleteIntegration = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [ConnectionType.Integration],
    mutationFn: (integrationId: string) =>
      deleteIntegration(axios, integrationId),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [ConnectionType.Integration] }),
  });
};
