import React from "react";
import GlobalStyles from "@mui/joy/GlobalStyles";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import Divider from "@mui/joy/Divider";
import IconButton from "@mui/joy/IconButton";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton, { listItemButtonClasses } from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import HelpIcon from "@mui/icons-material/Help";
import MessageIcon from "@mui/icons-material/Message";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LogoImage from "../../assets/logo-wizard.svg";
import { ColorSchemeToggle } from "../ColorSchemeToggle";
import { closeSidebar } from "../../utils";
import { Link, useLocation } from "react-router-dom";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import * as paths from "../../routes/paths";
import Stack from "@mui/joy/Stack";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import { Usage } from "../Usages";
import { useMe } from "../../api/queries/auth";
import { SHOW_CHAT_PAGE } from "../../constants";
import { useSession } from "../../hooks/useSession";
import { isEnterprise } from "../../utils/ee";

function Toggler({
  defaultExpanded = false,
  renderToggle,
  children,
}: {
  defaultExpanded?: boolean;
  children: React.ReactNode;
  renderToggle: (params: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultExpanded);
  return (
    <React.Fragment>
      {renderToggle({ open, setOpen })}
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "0.2s ease",
          "& > *": {
            overflow: "hidden",
          },
        }}
      >
        {children}
      </Box>
    </React.Fragment>
  );
}

export const Sidebar = () => {
  const { data: user } = useMe();
  const location = useLocation();

  const organization = user?.organization;
  const isOwner = user?.role === "owner";
  const { logout, name, email } = useSession();

  const handleLogout = () => {
    logout();
  };
  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: "fixed", md: "sticky" },
        transform: {
          xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))",
          md: "none",
        },
        transition: "transform 0.4s, width 0.4s",
        zIndex: 100,
        height: "100dvh",
        width: "var(--Sidebar-width)",
        top: 0,
        p: 2,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <GlobalStyles
        styles={(theme) => ({
          ":root": {
            "--Sidebar-width": "220px",
            [theme.breakpoints.up("lg")]: {
              "--Sidebar-width": "240px",
            },
          },
        })}
      />
      <Box
        className="Sidebar-overlay"
        sx={{
          position: "fixed",
          zIndex: 98,
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          opacity: "var(--SideNavigation-slideIn)",
          backgroundColor: "var(--joy-palette-background-backdrop)",
          transition: "opacity 0.4s",
          transform: {
            xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))",
            lg: "translateX(-100%)",
          },
        }}
        onClick={() => closeSidebar()}
      />
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <IconButton size="sm">
          <img src={LogoImage} />
        </IconButton>
        <Typography level="title-lg">Merlinn</Typography>
        <ColorSchemeToggle sx={{ ml: "auto" }} />
      </Box>

      <Box
        sx={{
          minHeight: 0,
          overflow: "hidden auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          [`& .${listItemButtonClasses.root}`]: {
            gap: 0,
          },
        }}
      >
        <List
          size="sm"
          sx={{
            gap: 1,
            "--List-nestedInsetStart": "30px",
            "--ListItem-radius": (theme) => theme.vars.radius.sm,
          }}
        >
          <ListItem>
            <ListItemButton>
              <Link
                to="/"
                style={{
                  display: "flex",
                  width: "100%",
                  textDecoration: "none",
                }}
              >
                <ListItemDecorator>
                  <HomeRoundedIcon />
                </ListItemDecorator>
                <ListItemContent>
                  <Typography level="title-sm">Home</Typography>
                </ListItemContent>
              </Link>
            </ListItemButton>
          </ListItem>
          {SHOW_CHAT_PAGE && (
            <ListItem>
              <ListItemButton>
                <Link
                  to="/chat"
                  style={{
                    display: "flex",
                    width: "100%",
                    textDecoration: "none",
                  }}
                >
                  <ListItemDecorator>
                    <MessageIcon />
                  </ListItemDecorator>
                  <ListItemContent>
                    <Typography level="title-sm">Chat</Typography>
                  </ListItemContent>
                </Link>
              </ListItemButton>
            </ListItem>
          )}

          {isOwner || !organization ? (
            !organization ? (
              <ListItemButton>
                <Link
                  to="/organization"
                  style={{
                    display: "flex",
                    width: "100%",
                    textDecoration: "none",
                  }}
                >
                  <ListItemDecorator>
                    <DashboardRoundedIcon />
                  </ListItemDecorator>
                  <ListItemContent>
                    <Typography level="title-sm">Organization</Typography>
                  </ListItemContent>
                </Link>
              </ListItemButton>
            ) : (
              <ListItem nested>
                <Toggler
                  defaultExpanded={location.pathname.includes("/organization")}
                  renderToggle={({ open, setOpen }) => (
                    <ListItemButton onClick={() => setOpen(!open)}>
                      <ListItemDecorator>
                        <DashboardRoundedIcon />
                      </ListItemDecorator>
                      <ListItemContent>
                        <Typography level="title-sm">Organization</Typography>
                      </ListItemContent>
                      <KeyboardArrowDownIcon
                        sx={{ transform: open ? "rotate(180deg)" : "none" }}
                      />
                    </ListItemButton>
                  )}
                >
                  <List sx={{ gap: 0.5 }}>
                    <ListItem sx={{ mt: 0.5 }}>
                      <Link
                        style={{ textDecoration: "none" }}
                        to={paths.ORGANIZATION_GENERAL_PATH}
                      >
                        <ListItemButton>General</ListItemButton>
                      </Link>
                    </ListItem>
                    {/* <ListItem>
                      <Link
                        style={{ textDecoration: "none" }}
                        to={paths.ORGANIZATION_PLAN_PATH}
                      >
                        <ListItemButton>Plan</ListItemButton>
                      </Link>
                    </ListItem> */}
                    <ListItem>
                      <Link
                        style={{ textDecoration: "none" }}
                        to={paths.ORGANIZATION_MEMBERS_PATH}
                      >
                        <ListItemButton>Members</ListItemButton>
                      </Link>
                    </ListItem>
                    <ListItem>
                      <Link
                        style={{ textDecoration: "none" }}
                        to={paths.ORGANIZATION_INTEGRATIONS_PATH}
                      >
                        <ListItemButton>Integrations</ListItemButton>
                      </Link>
                    </ListItem>
                    <ListItem>
                      <Link
                        style={{ textDecoration: "none" }}
                        to={paths.ORGANIZATION_KNOWLEDGE_GRAPH_PATH}
                      >
                        <ListItemButton>Knowledge Graph</ListItemButton>
                      </Link>
                    </ListItem>
                  </List>
                </Toggler>
              </ListItem>
            )
          ) : null}

          <ListItemButton>
            <Link
              to="/support"
              style={{
                display: "flex",
                width: "100%",
                textDecoration: "none",
              }}
            >
              <ListItemDecorator>
                <HelpIcon />
              </ListItemDecorator>
              <ListItemContent>
                <Typography level="title-sm">Support</Typography>
              </ListItemContent>
            </Link>
          </ListItemButton>
        </List>
      </Box>
      <Stack direction="column">
        {isOwner && isEnterprise() && (
          <>
            <Usage
              title="Queries"
              variable="queries"
              template="You have used %s out of %s queries per day."
              organizationId={organization?._id}
            />
            <div style={{ margin: "10px 0" }} />
            <Usage
              title="Seats"
              variable="seats"
              template="Your team has used %s out of %s seats."
              organizationId={organization?._id}
            />
          </>
        )}
        <Divider sx={{ margin: "20px 0" }} />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* TODO: Fix the picture maybe */}
          <Avatar variant="outlined" size="sm" />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              level="title-sm"
              sx={{
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {name}
            </Typography>
            <Typography
              level="body-xs"
              sx={{
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {email}
            </Typography>
          </Box>

          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={handleLogout}
          >
            <LogoutRoundedIcon />
          </IconButton>
        </Box>
      </Stack>
    </Sheet>
  );
};
