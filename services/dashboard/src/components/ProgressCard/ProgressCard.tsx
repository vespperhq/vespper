import Card from "@mui/joy/Card";
import LinearProgress from "@mui/joy/LinearProgress";
import Typography from "@mui/joy/Typography";
import { format } from "../../utils/strings";

interface Props {
  title: string;
  template: string;
  progress: {
    current: number;
    total: number;
  };
  color?: "primary" | "neutral" | "success" | "warning" | "danger";
}
const ProgressCard = ({
  title,
  template,
  progress = { current: 0, total: 4 },
  color,
}: Props) => {
  const { current, total } = progress;
  const description = format(template, current, total);
  const value = (progress.current / total) * 100;

  const _color =
    color || value < 33 ? "neutral" : value < 80 ? "warning" : "danger";

  return (
    <Card color={_color} variant="soft">
      <Typography level="title-md">{title}</Typography>
      <Typography level="body-sm">{description}</Typography>
      <LinearProgress
        variant="outlined"
        color={_color}
        value={value}
        determinate
      />
    </Card>
  );
};

export { ProgressCard };
