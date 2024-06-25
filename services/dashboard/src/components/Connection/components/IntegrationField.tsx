import { FieldConfiguration } from "../types";
import Input from "@mui/joy/Input";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import { SecretInput } from "../../SecretInput";
import FormHelperText from "@mui/joy/FormHelperText";

interface Props {
  value: string;
  config: FieldConfiguration;
  onChange: (value: string) => void;
}

const IntegrationField = ({ value, config, onChange }: Props) => {
  const inputType = config.input?.type || "text";

  const renderInput = () => {
    switch (inputType) {
      case "text": {
        return (
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            sx={{
              height: "40px",
              fontSize: "1em",
              lineHeight: "1em",
            }}
          />
        );
      }
      case "select": {
        return (
          <Select
            value={value}
            onChange={(event, value) => {
              if (!event || !value) {
                return;
              }
              onChange(value as string);
            }}
          >
            {config.input!.options!.map((option) => (
              <Option value={option}>{option}</Option>
            ))}
          </Select>
        );
      }
      case "secret": {
        return (
          <SecretInput
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
          />
        );
      }
    }
  };
  return (
    <FormControl
      sx={{
        marginTop: "15px",
      }}
    >
      <FormLabel>{config.label}</FormLabel>
      {renderInput()}
      {config.subtitle && <FormHelperText>{config.subtitle}</FormHelperText>}
    </FormControl>
  );
};

export { IntegrationField };
