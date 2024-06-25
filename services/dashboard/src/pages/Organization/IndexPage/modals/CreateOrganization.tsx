import React from "react";

import Button from "@mui/joy/Button";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Stack from "@mui/joy/Stack";
import Divider from "@mui/joy/Divider";

import DialogActions from "@mui/joy/DialogActions";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const CreateOrganizationModal = ({ open, onClose, onSubmit }: Props) => {
  const [name, setName] = React.useState<string>("");

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 100 }}>
      <ModalDialog>
        <DialogTitle>Create a new organization</DialogTitle>
        <Divider />
        <DialogContent>Insert the organization's name.</DialogContent>

        <Stack spacing={2}>
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              autoFocus
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormControl>
        </Stack>
        <DialogActions>
          <Button onClick={() => onSubmit(name)}>Create</Button>
          <Button variant="plain" color="neutral" onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
};

export { CreateOrganizationModal };
