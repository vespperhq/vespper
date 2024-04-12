import styled from "styled-components";
import { OrgTabs } from "../Tabs";
import { CircularProgress } from "@mui/material";
import Box from "@mui/joy/Box";
import { Connection } from "../../../components/Connection/Connection";
import {
  ConnectionType,
  ConnectionName,
  Vendor,
} from "../../../types/Connections";
import { useGetWebhooks } from "../../../api/queries/webhooks";
import { useVendors } from "../../../api/queries/vendors";
import { useMe } from "../../../api/queries/auth";

const Wrapper = styled.div`
  display: flex;
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
  padding-top: 20px;
  flex-direction: column;
  padding-bottom: 100px;
`;

const excludeVendors: string[] = [];

export const OrganizationWebhooksPage = () => {
  const meQuery = useMe();
  const webhooksQuery = useGetWebhooks();
  const vendorsQuery = useVendors();

  const isPending =
    meQuery.isPending || webhooksQuery.isPending || vendorsQuery.isPending;
  const { data: user } = meQuery;

  return (
    <>
      <OrgTabs />
      <Wrapper>
        <Box display="flex" flexWrap="wrap" justifyContent="start">
          {isPending ? (
            <CircularProgress
              style={{ marginLeft: "auto", marginRight: "auto" }}
            />
          ) : user?.organization?._id ? (
            vendorsQuery.data
              ?.filter(
                (vendor: Vendor) =>
                  !excludeVendors.includes(vendor.name as ConnectionName),
              )
              .map((vendor: Vendor) => {
                const webhook = webhooksQuery.data?.find(
                  (webhook: { vendor: Vendor }) =>
                    webhook.vendor?.name === vendor?.name,
                );

                return (
                  <Connection
                    key={vendor.name + ConnectionType.Webhook}
                    vendor={vendor}
                    data={webhook}
                    orgId={user?.organization?._id}
                    type={ConnectionType.Webhook}
                  />
                );
              })
          ) : (
            <div style={{ textAlign: "center", marginTop: 100 }}>
              Please add organization in Profile page
            </div>
          )}
        </Box>
      </Wrapper>
    </>
  );
};
