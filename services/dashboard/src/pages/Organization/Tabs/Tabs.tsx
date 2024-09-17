import Box from "@mui/joy/Box";
// import Chip from "@mui/joy/Chip";
import Tabs from "@mui/joy/Tabs";
import TabList from "@mui/joy/TabList";
import Tab, { tabClasses } from "@mui/joy/Tab";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

const tabIndices = {
  general: 0,
  // plan: 1,
  members: 1,
  integrations: 2,
  webhooks: 3,
  "knowledge-graph": 4,
};

const valueToTab = {
  0: "general",
  // 1: "plan",
  1: "members",
  2: "integrations",
  3: "webhooks",
  4: "knowledge-graph",
};

const Wrapper = styled(Box)`
  flex-grow: 1;
  overflow-x: hidden;
  margin-top: 50px;
`;

export const OrgTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = location?.pathname?.split("/");
  const tab = basePath?.pop() || "general";

  const index = tabIndices[tab as keyof typeof tabIndices];

  return (
    <Wrapper>
      <Tabs
        value={index}
        onChange={(_event, value) => {
          if (basePath) {
            navigate(
              `${basePath.join("/")}/${
                valueToTab[value as keyof typeof valueToTab]
              }`,
            );
          }
        }}
        defaultValue={0}
        sx={{
          bgcolor: "transparent",
        }}
      >
        <TabList
          tabFlex={1}
          size="sm"
          sx={{
            pl: { xs: 0, md: 4 },
            justifyContent: "left",
            [`&& .${tabClasses.root}`]: {
              fontWeight: "600",
              flex: "initial",
              color: "text.tertiary",
              [`&.${tabClasses.selected}`]: {
                bgcolor: "transparent",
                color: "text.primary",
                "&::after": {
                  height: "2px",
                  bgcolor: "primary.500",
                },
              },
            },
          }}
        >
          <Tab sx={{ borderRadius: "6px 6px 0 0" }} value={0}>
            General
          </Tab>
          {/* <Tab sx={{ borderRadius: "6px 6px 0 0" }} value={1}>
            Plan
          </Tab> */}
          <Tab sx={{ borderRadius: "6px 6px 0 0" }} value={1}>
            Members
          </Tab>
          <Tab sx={{ borderRadius: "6px 6px 0 0" }} value={2}>
            Integrations
          </Tab>
          <Tab sx={{ borderRadius: "6px 6px 0 0" }} value={4}>
            Knowledge Graph
          </Tab>
        </TabList>
      </Tabs>
    </Wrapper>
  );
};
