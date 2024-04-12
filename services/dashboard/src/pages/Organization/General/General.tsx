import {
  Box,
  Card,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/joy";
import { OrgTabs } from "../Tabs";
// import * as paths from "../../../routes/paths";
// import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Usage } from "../../../components/Usages";
import toast from "react-hot-toast";
import { useDeleteOrg } from "../../../api/queries/organizations";
import { useMe } from "../../../api/queries/auth";
import { InformationCard } from "./components/InformationCard";
import { DangerZone } from "../../../components/DangerZone";

const USAGE_PARAMS = [
  {
    title: "Seats",
    variable: "seats",
    template: "Your team has used %s out of %s seats.",
  },
  {
    title: "Indexing Attempts",
    variable: "indexingAttempts",
    template: "Your team has used %s out of %s indexing attempts per month.",
  },
  {
    title: "Indexing Documents",
    variable: "indexingDocuments",
    template: "Your team has used %s out of %s indexing documents.",
  },
  {
    title: "Alerts",
    variable: "alerts",
    template: "Your team has used %s out of %s alerts per day.",
  },
];

export const OrganizationGeneralPage = () => {
  const { data: user, isPending } = useMe();
  const queryClient = useQueryClient();

  const organization = user?.organization;

  const { mutateAsync: deleteOrganization } = useDeleteOrg();

  const handleDeleteOrganization = async () => {
    const promise = deleteOrganization(organization!._id);

    toast.promise(promise, {
      loading: "Deleting organization...",
      success: "Organization has been deleted!",
      error: "Could not delete organization",
    });

    await promise;
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };
  return (
    <>
      <OrgTabs />
      <Stack
        spacing={4}
        sx={{
          display: "flex",
          maxWidth: "80vw",
          width: "55vw",
          minWidth: "450px",
          mx: "auto",
          px: { xs: 2, md: 6 },
          py: { xs: 2, md: 3 },
        }}
      >
        {isPending ? (
          <CircularProgress
            sx={{
              marginTop: "100px !important",
              marginLeft: "auto !important",
              marginRight: "auto !important",
            }}
          />
        ) : (
          <>
            <InformationCard
              organization={organization}
              key={organization?._id}
            />
            <Card>
              <Box sx={{ mb: 1 }}>
                <Typography level="title-md">Usage</Typography>
                <Typography level="body-sm">
                  See your project's usage statistics
                </Typography>
              </Box>
              <Divider />

              {USAGE_PARAMS.map(({ title, variable, template }) => (
                <Usage
                  title={title}
                  variable={variable}
                  template={template}
                  organizationId={organization}
                />
              ))}
            </Card>
            {organization && (
              <DangerZone
                title="Delete this organization"
                description="Once deleted, it will be gone forever. Please be certain."
                dialogContent={`Are you sure you want to delete ${organization.name} organization?`}
                onDelete={handleDeleteOrganization}
                deleteButtonText="Delete organization"
              />
            )}
          </>
        )}
      </Stack>
    </>
  );
};
