import { useMutation, useQuery } from "@tanstack/react-query";
import { useAxios } from "../hooks";
import { createWebhook, getWebhooks } from "../calls/webhooks";
import { ConnectionType } from "../../types/Connections";

export const useCreateWebhook = () => {
  const axios = useAxios();

  return useMutation({
    mutationKey: ["create-webhook"],
    mutationFn: ({
      vendorName,
      organizationId,
      secret,
    }: {
      vendorName: string;
      organizationId: string;
      secret: string;
    }) => createWebhook(axios, vendorName, organizationId, secret),
  });
};

export const useGetWebhooks = () => {
  const axios = useAxios();

  return useQuery({
    queryKey: [ConnectionType.Webhook],
    queryFn: () => getWebhooks(axios),
  });
};
