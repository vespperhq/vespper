import styled from "styled-components";
import { OrgTabs } from "../Tabs";
import { CircularProgress } from "@mui/material";
import Box from "@mui/joy/Box";
import { useMe } from "../../../api/queries/auth";
import { useIntegrations } from "../../../api/queries/integrations";
import { useVendors } from "../../../api/queries/vendors";
import { Connection } from "../../../components/Connection/Connection";
import { ConnectionType, ConnectionName } from "../../../types/Connections";

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

export const OrganizationIntegrationsPage = () => {
  const meQuery = useMe();
  const integrationsQuery = useIntegrations();
  const vendorsQuery = useVendors();

  const isPending =
    meQuery.isPending || integrationsQuery.isPending || vendorsQuery.isPending;

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
            vendorsQuery.data?.map(
              (vendor: { name: ConnectionName; description: string }) => {
                const data = integrationsQuery.data?.find(
                  (integration: { vendor: { name: ConnectionName } }) =>
                    integration.vendor?.name === vendor?.name,
                );

                return (
                  <Connection
                    key={vendor.name + ConnectionType.Integration}
                    vendor={vendor}
                    data={data}
                    orgId={user?.organization?._id}
                    type={ConnectionType.Integration}
                  />
                );
              },
            )
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
