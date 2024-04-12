import React from "react";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import DialogTitle from "@mui/joy/DialogTitle";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import Divider from "@mui/joy/Divider";
import DialogContent from "@mui/joy/DialogContent";
import DialogActions from "@mui/joy/DialogActions";
import Button from "@mui/joy/Button";
import { ColorPaletteProp } from "@mui/joy/styles/types";

interface AlertDialogProps {
  open: boolean;
  onSubmit: () => void;
  onClose: () => void;
  message: string;
  label: string;
  color?: ColorPaletteProp;
  title?: string;
  icon?: React.ReactNode;
  sx?: object;
}
const AlertDialog = ({
  label,
  open,
  onSubmit,
  onClose,
  color = "danger",
  title = "Confirmation",
  icon,
  message,
}: AlertDialogProps) => {
  const iconComponent = icon ? icon : <WarningRoundedIcon color="error" />;
  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 100 }}>
      <ModalDialog variant="outlined" role="alertdialog">
        <DialogTitle>
          {iconComponent}
          {title}
        </DialogTitle>
        <Divider />
        <DialogContent>{message}</DialogContent>
        <DialogActions>
          <Button
            variant="solid"
            color={color}
            onClick={() => {
              onSubmit();
              onClose();
            }}
          >
            {label}
          </Button>
          <Button variant="plain" color="neutral" onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
};

export { AlertDialog };
