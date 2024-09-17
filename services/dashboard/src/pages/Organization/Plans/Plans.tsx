/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrgTabs } from "../Tabs";
import { Plans } from "../../../components/Plans";

export const OrganizationPlansPage = () => {
  return (
    <>
      <OrgTabs />
      <Plans
        onSelect={(plan: any) => {
          console.log("plan: ", plan);
        }}
      />
    </>
  );
};
