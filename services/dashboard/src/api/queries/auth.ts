import { getUser } from "../calls/users";
import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../hooks";

export const useMe = () => {
  const axios = useAxios();

  return useQuery({
    queryKey: ["me"],
    queryFn: () => getUser(axios),
  });
};
