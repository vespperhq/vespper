/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdateOrg } from "../../../../api/queries/organizations";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardOverflow,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Typography,
} from "@mui/joy";
import { FormGroup } from "@mui/material";
import * as paths from "../../../../routes/paths";

export const InformationCard = ({ organization }: any) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDirty, setIsDirty] = useState(false);

  const [orgFormData, setOrgFormData] = useState(
    organization
      ? {
          name: organization.name,
        }
      : {},
  );

  const planName = organization?.plan?.name;

  const { mutateAsync: updateOrganization } = useUpdateOrg();

  const submitForm = async () => {
    setIsDirty(false);
    const { name } = orgFormData;
    const promise = updateOrganization({
      name,
      organizationId: organization._id,
    });

    toast.promise(promise, {
      loading: "Updating organization...",
      success: "Organization has been updated!",
      error: "Could not update organization",
    });

    await promise;
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  return (
    <Card>
      <Box sx={{ mb: 1 }}>
        <Typography level="title-md">General information</Typography>
        <Typography level="body-sm">
          View & customize your organization's information
        </Typography>
      </Box>
      <Divider />
      <Stack direction="row" spacing={3} sx={{ display: "flex", my: 1 }}>
        <Stack spacing={2} sx={{ flexGrow: 1 }}>
          {!organization ? (
            <Typography level="title-md">
              You are not associated with any organization, please create one.
            </Typography>
          ) : null}
          <Stack direction="row" spacing={2}>
            <FormGroup
              onChange={() => {
                setIsDirty(true);
              }}
              sx={{ width: "100%" }}
              row
            >
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  size="sm"
                  value={orgFormData.name}
                  onChange={(e: any) =>
                    setOrgFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </FormControl>
              {organization && (
                <FormControl sx={{ flexGrow: 1, marginLeft: "20px" }}>
                  <FormLabel>ID</FormLabel>
                  <Input
                    size="sm"
                    sx={{ flexGrow: 1 }}
                    value={organization?._id}
                    disabled
                  />
                </FormControl>
              )}
            </FormGroup>
          </Stack>
        </Stack>
      </Stack>

      {organization?.plan && (
        <Card
          invertedColors
          variant="soft"
          color="warning"
          size="sm"
          sx={{
            boxShadow: "none",

            marginRight: "auto",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography level="title-sm">Plan</Typography>
          </Stack>
          <Typography level="body-xs" sx={{ marginBottom: "20px" }}>
            This organization is currently using the {planName} plan.
          </Typography>

          <Button
            size="sm"
            variant="solid"
            sx={{ width: "200px", marginRight: "auto" }}
            onClick={() => navigate(paths.ORGANIZATION_PLAN_PATH)}
          >
            View plan
          </Button>
        </Card>
      )}

      <CardOverflow sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        <CardActions sx={{ alignSelf: "flex-end", pt: 2 }}>
          <Button
            size="sm"
            variant="solid"
            onClick={submitForm}
            disabled={!isDirty}
          >
            {organization ? "Save" : "Create"}
          </Button>
        </CardActions>
      </CardOverflow>
    </Card>
  );
};
