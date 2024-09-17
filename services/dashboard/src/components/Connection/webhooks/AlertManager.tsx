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
import { CodeBlock } from "../../CodeBlock";

const CODE_SNIPPET = `
route:
  receiver: "slack-notifications"
  routes:
    - receiver: "slack-notifications"
      # If you have previous receivers (Slack, PagerDuty, etc),
      # the continue flag is a must. 
      continue: true 
    - receiver: "api-notifications"

receivers:
  - name: "api-notifications"
    webhook_configs:
      - url: "https://1234abcd.ngrok.io/webhooks/alertmanager"
# - url: "http://host.docker.internal:3000/webhooks/alertmanager"
# If you run Merlinn locally
        send_resolved: true
        http_config:
          authorization:
            type: Bearer
            # Replace this with your generated secret
            credentials: "CustomValue" 
`;

export const ConnectAlertManagerWebhook = ({ data }: ConnectionProps) => {
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
      vendorName: ConnectionName.AlertManager,
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
        <li>Go to your alert manager YAML file</li>
        <li>
          Add the following blocks under your receivers and route blocks:
          <CodeBlock code={CODE_SNIPPET} language="yaml" />
        </li>
      </OrderedList>
    </ConnectionWrapper>
  );
};
