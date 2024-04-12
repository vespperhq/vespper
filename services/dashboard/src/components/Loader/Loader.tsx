import CircularProgress from "@mui/joy/CircularProgress";
import Box from "@mui/joy/Box";

function Loader() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
    >
      <CircularProgress />
    </Box>
  );
}

export { Loader };
