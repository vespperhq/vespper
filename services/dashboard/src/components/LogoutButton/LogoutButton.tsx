import Button from "@mui/material/Button";
import { useSession } from "../../hooks/useSession";

function LogoutButton() {
  const { logout } = useSession();
  return (
    <Button color="inherit" onClick={logout}>
      Log Out
    </Button>
  );
}

export { LogoutButton };
