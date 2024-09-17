import { useQuery } from "@tanstack/react-query";
import { getAllVendors } from "../calls/vendors";
import { useAxios } from "../hooks";

export const useVendors = () => {
  const axios = useAxios();
  return useQuery({
    queryKey: ["all-vendors"],
    queryFn: () => getAllVendors(axios),
  });
};
