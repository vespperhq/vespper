import { ChangeEventHandler, useState } from "react";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import toast from "react-hot-toast";

interface Props {
  value: string;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

const SecretInput = ({ disabled, value, onChange }: Props) => {
  const [visible, setVisible] = useState(false);
  return (
    <Box position="relative">
      <Input
        disabled={disabled}
        value={value}
        onChange={onChange}
        sx={{ width: "100%" }}
        variant="outlined"
        type={visible ? "text" : "password"}
      />
      {value && (
        <Box position="absolute" right="5px" bottom="2px">
          {visible ? (
            <IconButton
              sx={{ "--IconButton-size": "30px" }}
              onClick={() => setVisible(false)}
            >
              <VisibilityOffIcon />
            </IconButton>
          ) : (
            <IconButton
              sx={{ "--IconButton-size": "30px" }}
              onClick={() => setVisible(true)}
            >
              <RemoveRedEyeIcon />
            </IconButton>
          )}
          <IconButton
            sx={{ "--IconButton-size": "30px", marginLeft: "5px" }}
            onClick={() => {
              if (navigator) {
                navigator.clipboard.writeText(value);
                toast.success("Copied to clipboard");
              }
            }}
          >
            <ContentCopyIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export { SecretInput };
