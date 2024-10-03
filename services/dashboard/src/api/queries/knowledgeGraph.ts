import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../hooks";
import { createIndex, deleteIndex, getIndex } from "../calls/knowledgeGraph";

export const useIndex = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ["index"],
    queryFn: () => getIndex(axios),
    refetchInterval: 1000,
  });
};

export const useCreateIndex = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["createIndex"],
    mutationFn: (requestData: { dataSources: string[] }) =>
      createIndex(axios, requestData),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["index"] });
    },
  });
};

export const useDeleteIndex = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteIndex"],
    mutationFn: (indexId: string) => deleteIndex(axios, indexId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["index"] }),
  });
};
