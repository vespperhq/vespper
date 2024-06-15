import Card from "@mui/joy/Card";
import Box from "@mui/joy/Box";
import { useMe } from "../../api/queries/auth";
import { Loader } from "../../components/Loader";
import { useSession } from "../../hooks/useSession";

function HomePage() {
  const meQuery = useMe();
  const { loading: authLoading, name } = useSession();

  const isPending = meQuery.isPending || authLoading;
  const organizationId = meQuery.data?.organization?._id;

  const message = (() => {
    if (!isPending) {
      if (!organizationId) {
        return "Welcome! Create an organization to get started 🚀";
      } else {
        return `Welcome back ${name} 😊`;
      }
    }
  })();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
    >
      <Card variant="soft" color="primary">
        {meQuery.isPending ? <Loader /> : message}
      </Card>
    </Box>
  );
}

export { HomePage };
