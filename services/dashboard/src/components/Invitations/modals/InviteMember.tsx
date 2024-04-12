import React, { useState } from "react";

import Button from "@mui/joy/Button";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Stack from "@mui/joy/Stack";
import Divider from "@mui/joy/Divider";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Grid from "@mui/joy/Grid";
import Link from "@mui/joy/Link";
import Checkbox from "@mui/joy/Checkbox";

import PDImage from "../../../assets/logo-pagerduty.png";
import OGImage from "../../../assets/logo-opsgenie.png";
import DialogActions from "@mui/joy/DialogActions";
import { useImportOpsgenieUsers } from "../../../api/queries/invite";
import CircularProgress from "@mui/joy/CircularProgress";
import Table from "@mui/joy/Table";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { getComparator } from "../../../utils/array";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (emails: string[]) => void;
}

interface ImportCardProps {
  title: "PagerDuty" | "Opsgenie";
  description: string;
  onClick: () => void;
  loading: boolean;
}

const ImportCard = ({
  title,
  description,
  onClick,
  loading,
}: ImportCardProps) => {
  const image = title === "PagerDuty" ? PDImage : OGImage;
  return (
    <Card
      variant="outlined"
      sx={{
        height: "75px",
        "&:hover": {
          boxShadow: "md",
          borderColor: "neutral.outlinedHoverBorder",
        },
      }}
    >
      <CardContent sx={{ position: "relative" }}>
        <Stack direction="column">
          {loading ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translateX(-50%) translateY(-50%)",
              }}
            >
              <CircularProgress size="sm" thickness={3} />
            </div>
          ) : (
            <>
              <Stack direction="row" alignItems="center" justifyItems="center">
                <img src={image} width={30} height={30} />
                <Typography level="title-sm" sx={{ marginLeft: "8px" }}>
                  <Link
                    onClick={onClick}
                    overlay
                    underline="none"
                    sx={{ color: "text.tertiary" }}
                  >
                    {title}
                  </Link>
                </Typography>
              </Stack>
              <Typography level="body-sm">{description}</Typography>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

type Order = "asc" | "desc";

interface ImportedUsersTableProps {
  users: { id: string; email: string; name: string }[];
  selected: string[];
  setSelected: (val: ((items: string[]) => string[]) | string[]) => void;
}

const ImportedUsersTable = ({
  users,
  selected,
  setSelected,
}: ImportedUsersTableProps) => {
  const [order, setOrder] = React.useState<Order>("desc");

  return (
    <Table
      aria-labelledby="tableTitle"
      stickyHeader
      hoverRow
      sx={{
        "--TableCell-headBackground": "var(--joy-palette-background-level1)",
        "--Table-headerUnderlineThickness": "1px",
        "--TableRow-hoverBackground": "var(--joy-palette-background-level1)",
        "--TableCell-paddingY": "4px",
        "--TableCell-paddingX": "8px",
      }}
    >
      <thead>
        <tr>
          <th style={{ width: 48, textAlign: "center", padding: "12px 6px" }}>
            <Checkbox
              size="sm"
              indeterminate={
                selected.length > 0 && selected.length !== users.length
              }
              checked={selected.length === users.length}
              onChange={(event) => {
                setSelected(
                  event.target.checked ? users.map((user) => user.id) : [],
                );
              }}
              color={
                selected.length > 0 || selected.length === users.length
                  ? "primary"
                  : undefined
              }
              sx={{ verticalAlign: "text-bottom" }}
            />
          </th>
          <th style={{ width: 120, padding: "12px 6px" }}>
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
              Email
            </Link>
          </th>
          <th style={{ width: 140, padding: "12px 6px" }}>Name</th>
        </tr>
      </thead>
      <tbody>
        {users
          .slice()
          .sort(getComparator(order, "id"))
          .map((user) => (
            <tr key={user.id}>
              <td style={{ textAlign: "center", width: 120 }}>
                <Checkbox
                  size="sm"
                  checked={selected.includes(user.id)}
                  color={selected.includes(user.id) ? "primary" : undefined}
                  onChange={(event) => {
                    setSelected((ids) =>
                      event.target.checked
                        ? ids.concat(user.id)
                        : ids.filter((itemId) => itemId !== user.id),
                    );
                  }}
                  slotProps={{ checkbox: { sx: { textAlign: "left" } } }}
                  sx={{ verticalAlign: "text-bottom" }}
                />
              </td>
              <td>
                <Typography level="body-xs">{user.email}</Typography>
              </td>
              <td>
                <Typography level="body-xs">{user.name}</Typography>
              </td>
            </tr>
          ))}
      </tbody>
    </Table>
  );
};
const InviteMemberModal = ({ open, onClose, onSubmit }: Props) => {
  const [email, setEmail] = React.useState<string>("");
  const [showTable, setShowTable] = React.useState<boolean>(false);
  const [selected, setSelected] = useState<string[]>([]);

  const ogUsersQuery = useImportOpsgenieUsers();

  const ogUsers = ogUsersQuery.data
    ? ogUsersQuery.data.users.map((user) => ({
        id: user.id,
        email: user.username,
        name: user.fullName,
      }))
    : null;

  const handleClose = () => {
    setShowTable(false);
    onClose();
  };
  const handleSubmit = () => {
    const emails =
      showTable && ogUsers
        ? ogUsers
            ?.filter((user) => selected.includes(user.id))
            .map((user) => user.email)
        : [email];
    setShowTable(false);
    setSelected([]);
    onSubmit(emails);
  };
  return (
    <Modal open={open} onClose={handleClose} sx={{ zIndex: 100 }}>
      <ModalDialog sx={{ minWidth: "600px" }}>
        <DialogTitle>Invite new members</DialogTitle>
        <Divider />
        <DialogContent>
          Insert the member's company e-mail address.
        </DialogContent>

        <Stack spacing={2}>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              autoFocus
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormControl>
          <Divider>Or</Divider>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            {showTable && ogUsers ? (
              <Grid xs={12}>
                <ImportedUsersTable
                  selected={selected}
                  setSelected={setSelected}
                  users={ogUsers}
                />
              </Grid>
            ) : (
              <>
                <Grid xs={6}>
                  <ImportCard
                    title="PagerDuty"
                    description="Import your team from PagerDuty"
                    onClick={() => console.log("PagerDuty Clicked")}
                    loading={false}
                  />
                </Grid>
                <Grid xs={6}>
                  <ImportCard
                    title="Opsgenie"
                    description="Import your team from OpsGenie"
                    onClick={() => {
                      setShowTable(true);
                      ogUsersQuery.refetch();
                    }}
                    loading={ogUsersQuery.isLoading}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Stack>
        <DialogActions>
          <Button onClick={handleSubmit}>Invite</Button>
          <Button variant="plain" color="neutral" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
};

export { InviteMemberModal };
