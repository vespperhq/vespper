import { useQuery } from "@tanstack/react-query";
import { getFeatures } from "../calls/features";
import { useAxios } from "../hooks";

export const useFeatures = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ["features"],
    queryFn: () => getFeatures(axios),
  });
};
