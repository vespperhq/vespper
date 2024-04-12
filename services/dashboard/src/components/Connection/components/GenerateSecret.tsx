import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Box, Button, Typography } from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";

import { SecretInput } from "../../SecretInput";

interface Props {
  onGenerate: (value: string) => void;
  existingSecret: string;
}

export const GenerateSecret = ({ onGenerate, existingSecret }: Props) => {
  const [secret, setSecret] = useState(existingSecret || "");
  return (
    <Box display="flex" flexDirection="column" width="100%">
      <Box position="relative">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom="10px"
        >
          <Typography level="body-xs">A secret key for the webhook</Typography>
          <Button
            size="sm"
            variant="plain"
            disabled={!!secret}
            sx={{ width: "100px" }}
            onClick={() => {
              const value = uuid();
              setSecret(value);
              onGenerate(value);
            }}
          >
            <AddIcon sx={{ marginRight: "5px" }} /> Generate
          </Button>
        </Box>
        <SecretInput disabled={!secret} value={secret} />
      </Box>
    </Box>
  );
};
