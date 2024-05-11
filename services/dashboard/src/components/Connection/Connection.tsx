/* eslint-disable @typescript-eslint/no-explicit-any */
import { icons } from "./icons";
import { useCallback, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  ListDivider,
  Typography,
} from "@mui/joy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  ConnectionType,
  ConnectionName,
  Mode,
  Vendor,
} from "../../types/Connections";
import {
  ConnectDataDogIntegration,
  ConnectCoralogixIntegration,
  ConnectGrafanaIntegration,
  ConnectGithubIntegration,
  ConnectPageDutyIntegration,
  ConnectSlackIntegration,
  ConnectOpsgenieIntegration,
  ConnectNotionIntegration,
  ConnectConfluenceIntegration,
  ConnectJiraIntegration,
  ConnectMongoDBIntegration,
  ConnectJaegerIntegration,
  ConnectPrometheusIntegration,
} from "./integrations";
import { CustomPaper, Null } from "./styles";

import {
  ConnectPageDutyWebhook,
  ConnectOpsgenieWebhook,
  ConnectAlertManagerWebhook,
} from "./webhooks";
import { Modal } from "../Modal";
import {
  useCreateIntegration,
  useDeleteIntegration,
} from "../../api/queries/integrations";
import toast from "react-hot-toast";

const connectVendor = {
  [ConnectionType.Integration]: {
    [ConnectionName.Github]: ConnectGithubIntegration,
    [ConnectionName.Coralogix]: ConnectCoralogixIntegration,
    [ConnectionName.Grafana]: ConnectGrafanaIntegration,
    [ConnectionName.Jaeger]: ConnectJaegerIntegration,
    [ConnectionName.DataDog]: ConnectDataDogIntegration,
    [ConnectionName.Slack]: ConnectSlackIntegration,
    [ConnectionName.PagerDuty]: ConnectPageDutyIntegration,
    [ConnectionName.Opsgenie]: ConnectOpsgenieIntegration,
    [ConnectionName.Notion]: ConnectNotionIntegration,
    [ConnectionName.Confluence]: ConnectConfluenceIntegration,
    [ConnectionName.Jira]: ConnectJiraIntegration,
    [ConnectionName.MongoDB]: ConnectMongoDBIntegration,
    [ConnectionName.Prometheus]: ConnectPrometheusIntegration,
  },
  [ConnectionType.Webhook]: {
    [ConnectionName.Opsgenie]: ConnectOpsgenieWebhook,
    [ConnectionName.PagerDuty]: ConnectPageDutyWebhook,
    [ConnectionName.AlertManager]: ConnectAlertManagerWebhook,
  },
};

// Put here integrations that are in beta
const BETA: ConnectionName[] = [];

interface ConnectRequest {
  url?: string;
  body?: any;
  config?: any;
}

interface Props {
  orgId: string;
  vendor: Vendor;
  data: any;
  type: ConnectionType;
}

export const Connection = ({ vendor, data, orgId, type }: Props) => {
  const [mode, setMode] = useState(Mode.View);
  const [formData, setFormData] = useState({});
  const [requestData, setRequestData] = useState<ConnectRequest>({});

  const { name } = vendor;
  const Icon = icons?.[name as keyof typeof icons] || Null;
  const vendorTypeConnections = connectVendor[type];
  const ConnectionComponent =
    vendorTypeConnections[name as keyof typeof vendorTypeConnections];

  const connectRequest = useCreateIntegration();

  // TODO: handle conenct and delete are specific to integrations while this component
  // includes also webhooks
  const handleConnect = useCallback(() => {
    setMode(Mode.View);
    if (Object.keys(requestData).length > 0) {
      const promise = connectRequest.mutateAsync(requestData);
      toast.promise(promise, {
        loading: "Creating integration...",
        success: "Integration was successfully created",
        error: "Could not create the integration",
      });
    }
  }, [requestData, connectRequest]);

  const handleDelete = () => {
    setMode(Mode.View);
    const promise = deleteIntegration(data._id);
    toast.promise(promise, {
      loading: "Deleting integration...",
      success: "Integration was successfully deleted",
      error: "Could not delete the integration",
    });
  };
  const deleteRequest = useDeleteIntegration();

  const { mutateAsync: deleteIntegration } = deleteRequest;

  const isPending = connectRequest.isPending || deleteRequest.isPending;

  if (!ConnectionComponent) {
    return null;
  }

  return (
    <CustomPaper sx={{ boxShadow: "lg" }}>
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Icon
              style={{ marginRight: "10px", width: "30px", height: "30px" }}
            />
            <Typography level="title-sm">{vendor.name}</Typography>
          </div>
          {BETA.includes(vendor.name) && (
            <Chip color="warning" size="sm">
              Beta
            </Chip>
          )}
        </div>
        <ListDivider sx={{ margin: "20px 0" }} />
        <Typography level="body-sm">{vendor.description}</Typography>
      </div>
      <Modal
        title={`${vendor.name} Instructions`}
        open={mode === Mode.Connect}
        onClose={() => setMode(Mode.View)}
        sx={{ width: "40vw" }}
      >
        <ConnectionComponent
          data={data}
          orgId={orgId}
          setFormData={setFormData}
          formData={formData}
          setRequestData={setRequestData}
        />

        {type === ConnectionType.Integration && !data ? (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            <Button variant="outlined" onClick={() => setMode(Mode.View)}>
              Cancel
            </Button>
            <Button
              sx={{ marginLeft: "20px" }}
              color="success"
              onClick={() => {
                handleConnect();
              }}
            >
              Connect
            </Button>
          </div>
        ) : (
          type === ConnectionType.Integration &&
          data && (
            <Button
              variant="outlined"
              color="danger"
              onClick={handleDelete}
              sx={{ marginTop: "20px" }}
            >
              Delete
            </Button>
          )
        )}
      </Modal>

      {isPending ? (
        <CircularProgress />
      ) : data ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center">
            <CheckCircleIcon
              color="success"
              sx={{ marginRight: "10px", fontSize: "1.5em" }}
            />
            <Typography level="body-sm" color="success">
              Connected!
            </Typography>
          </Box>
          <IconButton onClick={() => setMode(Mode.Connect)}>
            <SettingsIcon />
          </IconButton>
        </div>
      ) : (
        <Button color="primary" onClick={() => setMode(Mode.Connect)}>
          Add
        </Button>
      )}
    </CustomPaper>
  );
};
