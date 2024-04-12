import React from "react";
import { Navigate } from "react-router-dom";
import { ORGANIZATION_GENERAL_PATH } from "../../../routes/paths";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import AddIcon from "@mui/icons-material/Add";
import toast from "react-hot-toast";
import { CreateOrganizationModal } from "./modals";
import { useCreateOrg } from "../../../api/queries/organizations";
import { useQueryClient } from "@tanstack/react-query";
import { CircularProgress } from "@mui/joy";
import { useMe } from "../../../api/queries/auth";

export const OrgIndexPage = () => {
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const { data: user, isPending } = useMe();
  const queryClient = useQueryClient();

  const { mutateAsync: createOrganization } = useCreateOrg();

  if (!isPending && user?.organization) {
    return <Navigate to={ORGANIZATION_GENERAL_PATH} />;
  }

  const handleSubmit = async (name: string) => {
    setModalOpen(false);
    const promise = createOrganization(name);
    toast.promise(promise, {
      loading: "Creating organization...",
      success: "Organization has been created!",
      error: "Could not create organization",
    });

    await promise;
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  return (
    <>
      <CreateOrganizationModal
        open={modalOpen}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      />
      <div
        style={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isPending ? (
          <CircularProgress />
        ) : (
          <Card variant="soft">
            <Typography>
              Looks like you don't belong to an organization
            </Typography>
            <Button
              startDecorator={<AddIcon />}
              onClick={() => setModalOpen(true)}
              size="sm"
            >
              Create a new organization
            </Button>
          </Card>
        )}
      </div>
    </>
  );
};
