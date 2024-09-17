/* eslint-disable @typescript-eslint/no-explicit-any */
import JoyModal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: any;
  children: any;
  sx?: object;
}

export const Modal = ({
  open,
  title,
  onClose,
  children,
  sx = {},
}: ModalProps) => {
  return (
    <JoyModal open={open} onClose={onClose} sx={{ zIndex: 101 }}>
      <ModalDialog sx={sx}>
        <ModalClose />
        <Typography
          component="h2"
          id="modal-title"
          level="h4"
          textColor="inherit"
          fontWeight="lg"
          mb={1}
        >
          {title}
        </Typography>
        {children}
      </ModalDialog>
    </JoyModal>
  );
};
