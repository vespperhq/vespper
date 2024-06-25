import Button from "@mui/joy/Button";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import Divider from "@mui/joy/Divider";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import DialogActions from "@mui/joy/DialogActions";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const DeleteMemberModal = ({ open, onClose, onSubmit }: Props) => {
  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 100 }}>
      <ModalDialog variant="outlined" role="alertdialog">
        <DialogTitle>
          <WarningRoundedIcon />
          Confirmation
        </DialogTitle>
        <Divider />
        <DialogContent>
          Are you sure you want to delete this member?
        </DialogContent>
        <DialogActions>
          <Button variant="solid" color="danger" onClick={onSubmit}>
            Delete member
          </Button>
          <Button variant="plain" color="neutral" onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
};

export { DeleteMemberModal };
