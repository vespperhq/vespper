import { useOrgUsage } from "../../api/queries/organizations";
import { ProgressCard } from "../ProgressCard";

interface Props {
  title: string;
  template: string;
  variable: string;
  organizationId: string;
}

const Usage = ({ title, template, variable, organizationId }: Props) => {
  const usageQuery = useOrgUsage(organizationId);
  if (usageQuery.isPending) {
    return null;
  }
  const { usage = {} } = usageQuery.data || {};
  return (
    <ProgressCard
      title={title}
      template={template}
      progress={usage[variable]}
    />
  );
};

export { Usage };
