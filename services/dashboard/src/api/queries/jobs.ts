import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../hooks";
import { getJobs } from "../calls/jobs";

export const useJob = (organization: string, type: string, status: string) => {
  const axios = useAxios();
  return useQuery({
    queryKey: ["jobs", organization, type, status],
    queryFn: () => getJobs(axios, organization, type, status),
    refetchInterval: 1000,
    structuralSharing: false,
  });
};
