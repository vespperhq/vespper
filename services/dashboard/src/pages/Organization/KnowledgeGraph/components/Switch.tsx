import Switch from "@mui/joy/Switch";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";

export const CustomSwitch = ({
  onChange,
  checked,
  defaultChecked,
  disabled,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange: (e: { target: { checked: boolean } }) => void;
}) => {
  return (
    <Stack direction="row" spacing={2}>
      <Switch
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        slotProps={{
          track: {
            children: (
              <>
                <Typography
                  component="span"
                  level="inherit"
                  sx={{ ml: "10px" }}
                >
                  On
                </Typography>
                <Typography component="span" level="inherit" sx={{ mr: "8px" }}>
                  Off
                </Typography>
              </>
            ),
          },
        }}
        sx={{
          "--Switch-thumbSize": "27px",
          "--Switch-trackWidth": "64px",
          "--Switch-trackHeight": "31px",
        }}
      />
    </Stack>
  );
};
