import { useState } from "react";
import { Box, Button, Card, Typography } from "@mui/joy";
import { AlertDialog } from "../Dialogs";

type Props = {
  title: string;
  description: string;
  dialogContent: string;
  deleteButtonText: string;
  onDelete: () => void;
  sx?: { [key: string]: string };
};

export const DangerZone = ({
  title,
  description,
  dialogContent,
  deleteButtonText,
  onDelete,
  sx = {},
}: Props) => {
  const [deleteOrgModal, setDeleteOrgModal] = useState(false);

  return (
    <Box sx={sx}>
      <Typography level="title-lg" color="danger">
        Danger zone
      </Typography>
      <Card
        sx={{
          borderColor: "var(--joy-palette-danger-plainColor)",
          marginTop: "10px",
        }}
        color="danger"
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography level="title-md">{title}</Typography>
            <Typography level="body-sm">{description}</Typography>
          </Box>
          <Button
            size="md"
            variant="solid"
            color="danger"
            onClick={() => setDeleteOrgModal(true)}
          >
            {deleteButtonText}
          </Button>
        </Box>
      </Card>
      <AlertDialog
        label="Delete"
        open={deleteOrgModal}
        onSubmit={onDelete}
        onClose={() => setDeleteOrgModal(false)}
        message={dialogContent}
      />
    </Box>
  );
};
