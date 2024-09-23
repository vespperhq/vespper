/* eslint-disable @typescript-eslint/no-explicit-any */
import toast from "react-hot-toast";
import { ConnectionType, ConnectionName } from "../../../types/Connections";
import { useCreateWebhook } from "../../../api/queries/webhooks";
import { useMe } from "../../../api/queries/auth";
import { useQueryClient } from "@tanstack/react-query";
import { GenerateSecret } from "../components";
import { ConnectionWrapper, OrderedList } from "../styles";

export const ConnectPageDutyWebhook = ({ data }: any) => {
  const meQuery = useMe();
  const queryClient = useQueryClient();

  const { data: user } = meQuery;

  const organizationId = user?.organization?._id;
  const { mutateAsync: createWebhook } = useCreateWebhook();

  const handleGenerate = async (secret: string) => {
    if (navigator) {
      navigator.clipboard.writeText(secret);
    }

    const promise = createWebhook({
      vendorName: ConnectionName.PagerDuty,
      organizationId,
      secret,
    });

    toast.promise(promise, {
      loading: "Creating secret...",
      success: "Secret has been created!",
      error: "Could not create secret",
    });

    await promise;
    queryClient.invalidateQueries({ queryKey: [ConnectionType.Webhook] });
  };

  return (
    <ConnectionWrapper>
      <GenerateSecret
        onGenerate={handleGenerate}
        existingSecret={data?.secret}
      />
      <OrderedList>
        <li>Choose Integrations → Generic Webhooks (V3)</li>
        <li>Click “New Webhook”</li>
        <li>
          If you're running Merlinn locally, put your ngrok tunnel, followed by
          /webhooks/pagerduty. For example:
          https://1234abcd.ngrok.io/webhooks/pagerduty
        </li>
        <li>In the scope type, choose “Account”</li>
        <li>
          In the event subscription section, click “Deselect all” and choose
          only “incident.triggered”
        </li>
        <li>
          Add a custom header called “x-vespper-secret” and insert your secret.
        </li>
        <li>Click “Add Webhook”</li>
      </OrderedList>
    </ConnectionWrapper>
  );
};
