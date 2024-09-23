import { useQueryClient } from "@tanstack/react-query";
import { useCreateWebhook } from "../../../api/queries/webhooks";
import {
  ConnectionProps,
  ConnectionType,
  ConnectionName,
} from "../../../types/Connections";
import { GenerateSecret } from "../components";
import toast from "react-hot-toast";
import { useMe } from "../../../api/queries/auth";
import { ConnectionWrapper, OrderedList } from "../styles";

export const ConnectOpsgenieWebhook = ({ data }: ConnectionProps) => {
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
      vendorName: ConnectionName.Opsgenie,
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
        <li>Go to Settings → Integrations → Add new integration</li>
        <li>Search “Webhook” and click it</li>
        <li>Give it a name and click create.</li>
        <li>
          Go to the integration settings and choose “Authenticate with a Webhook
          account”
        </li>
        <li>
          If you're running Vespper locally, put your ngrok tunnel, followed by
          /webhooks/opsgenie. For example:
          https://1234abcd.ngrok.io/webhooks/opsgenie
        </li>
        <li>
          Add a custom header called x-vespper-secret and put your secret.
        </li>
        <li>
          Mark the “Add Alert Description to Payload” and “Add Alert Details to
          Payload” options.
        </li>
        <li>Click “Save”</li>
        <li>In the Alert Actions section, choose only “Alert is created”</li>
      </OrderedList>
    </ConnectionWrapper>
  );
};
