import React from "react";
import Avatar from "@mui/joy/Avatar";
import Chip from "@mui/joy/Chip";
import Link from "@mui/joy/Link";
import Table from "@mui/joy/Table";
import Typography from "@mui/joy/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SecurityIcon from "@mui/icons-material/Security";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt1";
import MoreHorizIcon from "@mui/icons-material/MoreHorizOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SearchIcon from "@mui/icons-material/Search";
import Sheet from "@mui/joy/Sheet";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import Dropdown from "@mui/joy/Dropdown";
import MenuButton from "@mui/joy/MenuButton";
import Menu from "@mui/joy/Menu";
import MenuItem from "@mui/joy/MenuItem";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import ListDivider from "@mui/joy/ListDivider";
import { InviteMemberModal, DeleteMemberModal } from "./modals";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import CircularProgress from "@mui/joy/CircularProgress";
import { useDeleteUser, useOrgUsers } from "../../api/queries/users";
import { useInviteUsers } from "../../api/queries/invite";
import toast from "react-hot-toast";
import { Order, getComparator } from "../../utils/array";
import { capitalize } from "../../utils/strings";
import { useMe } from "../../api/queries/auth";

const status2label = {
  activated: "Active",
  invited: "Sent Invitation",
} as Record<string, string>;

const Invitations = () => {
  const [order, setOrder] = React.useState<Order>("desc");
  const [search, setSearch] = React.useState<string>("");
  const [inviteOpen, setInviteOpen] = React.useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = React.useState<boolean>(false);
  const [contextMember, setContextMember] = React.useState<string | null>(null);

  const { data: user } = useMe();
  const organizationId = user?.organization._id;

  const usersQuery = useOrgUsers(organizationId);

  const rows = React.useMemo(() => {
    if (usersQuery.isPending) {
      return [];
    }
    const { users } = usersQuery.data;
    if (search) {
      return users.filter((user: { email: string }) =>
        user.email.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return users;
  }, [search, usersQuery.isPending, usersQuery.data]);

  const { mutateAsync: inviteUsers } = useInviteUsers();
  const { mutateAsync: deleteUser } = useDeleteUser();

  const handleInviteUsers = async (emails: string[]) => {
    setInviteOpen(false);
    const promise = inviteUsers(emails);
    const messages =
      emails.length > 1
        ? {
            loading: "Sending invitations...",
            success: "Invitations sent!",
            error: "Could not send invitations",
          }
        : {
            loading: "Sending invitation...",
            success: "Invitation sent!",
            error: "Could not send invitation",
          };
    toast.promise(promise, messages);

    await promise;
    usersQuery.refetch();
  };
  const handleDeleteUser = async () => {
    setDeleteOpen(false);
    setContextMember(null);

    const promise = deleteUser(contextMember!);
    toast.promise(promise, {
      loading: "Deleting user...",
      success: "User was deleted",
      error: "Could not delete user",
    });

    await promise;
    usersQuery.refetch();
  };
  return (
    <>
      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInviteUsers}
      />
      <DeleteMemberModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSubmit={handleDeleteUser}
      />
      <Box
        component="main"
        className="MainContent"
        sx={{
          px: { xs: 2, md: 6 },
          pt: {
            xs: "calc(12px + var(--Header-height))",
            sm: "calc(12px + var(--Header-height))",
            md: 3,
          },
          pb: { xs: 2, sm: 2, md: 3 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100dvh",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            mb: 1,
            gap: 1,
            flexDirection: { xs: "column-reverse", sm: "row-reverse" },
            alignItems: { xs: "start", sm: "center" },
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <Button
            color="primary"
            startDecorator={<PersonAddAltIcon />}
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            Invite members
          </Button>
          <FormControl sx={{ flex: 1 }} size="sm">
            <FormLabel>Find a member</FormLabel>
            <Input
              size="sm"
              placeholder="Find"
              startDecorator={<SearchIcon />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ width: "25%" }}
            />
          </FormControl>
        </Box>
        <Sheet>
          <Table
            aria-labelledby="tableTitle"
            stickyHeader
            hoverRow
            sx={{
              "--TableCell-headBackground":
                "var(--joy-palette-background-level1)",
              "--Table-headerUnderlineThickness": "1px",
              "--TableRow-hoverBackground":
                "var(--joy-palette-background-level1)",
              "--TableCell-paddingY": "4px",
              "--TableCell-paddingX": "8px",
              position: "relative",
            }}
          >
            <thead>
              <tr>
                <th style={{ width: 200, padding: "12px 6px" }}>
                  <Link
                    underline="none"
                    color="primary"
                    component="button"
                    onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                    fontWeight="lg"
                    endDecorator={<ArrowDropDownIcon />}
                    sx={{
                      "& svg": {
                        transition: "0.2s",
                        transform:
                          order === "desc" ? "rotate(0deg)" : "rotate(180deg)",
                      },
                    }}
                  >
                    Name
                  </Link>
                </th>
                <th style={{ padding: "12px 6px" }}>Email</th>
                <th style={{ padding: "12px 6px" }}>Status</th>
                <th style={{ padding: "12px 6px" }}>Role</th>
                <th style={{ padding: "12px 6px" }}> </th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isPending ? (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <CircularProgress size="sm" thickness={3} />
                </div>
              ) : (
                rows
                  .slice()
                  .sort(getComparator(order, "email"))
                  .map(
                    (row: {
                      _id: string;
                      name: string;
                      email: string;
                      status: string;
                      role: string;
                      picture: string;
                    }) => (
                      <tr key={row._id}>
                        <td style={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            src={row.picture}
                            alt={row.email}
                            sx={{
                              marginRight: "8px",
                              width: "25px",
                              height: "25px",
                            }}
                          />
                          <Typography level="body-xs">{row.name}</Typography>
                        </td>
                        <td>
                          <Typography level="body-xs">{row.email}</Typography>
                        </td>
                        <td>
                          <Chip
                            variant="soft"
                            size="sm"
                            color={
                              row.status === "activated" ? "success" : "warning"
                            }
                          >
                            {status2label[row.status]}
                          </Chip>
                        </td>
                        <td>
                          <Chip variant="soft" size="sm" color="neutral">
                            {capitalize(row.role)}
                          </Chip>
                        </td>
                        <td>
                          {row._id !== user._id && (
                            <Dropdown>
                              <MenuButton
                                size="sm"
                                slots={{ root: IconButton }}
                                slotProps={{
                                  root: { color: "neutral" },
                                }}
                              >
                                <MoreHorizIcon />
                              </MenuButton>
                              <Menu size="sm">
                                <MenuItem>
                                  <ListItemDecorator sx={{ color: "inherit" }}>
                                    <SecurityIcon />
                                  </ListItemDecorator>{" "}
                                  Change role
                                </MenuItem>
                                <ListDivider />
                                <MenuItem
                                  variant="soft"
                                  color="danger"
                                  onClick={() => {
                                    setContextMember(row._id);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <ListItemDecorator sx={{ color: "inherit" }}>
                                    <DeleteForeverIcon />
                                  </ListItemDecorator>{" "}
                                  Delete user
                                </MenuItem>
                              </Menu>
                            </Dropdown>
                          )}
                        </td>
                      </tr>
                    ),
                  )
              )}
            </tbody>
          </Table>
        </Sheet>
      </Box>
    </>
  );
};

export { Invitations };
