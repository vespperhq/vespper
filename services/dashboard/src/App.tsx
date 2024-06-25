import React from "react";
import "./App.css";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { Box } from "@mui/joy";
import { SessionProvider } from "./providers/auth";

const queryClient = new QueryClient();

const ReactQueryDevtoolsProduction = React.lazy(() =>
  import("@tanstack/react-query-devtools/build/modern/production.js").then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
);

function App() {
  const [showDevtools, setShowDevtools] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.toggleDevtools = () => setShowDevtools((old) => !old);
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {showDevtools && (
          <React.Suspense fallback={null}>
            <ReactQueryDevtoolsProduction />
          </React.Suspense>
        )}
        <CssVarsProvider>
          <CssBaseline />
          <Box sx={{ display: "flex", height: "100%" }}>
            <Toaster
              toastOptions={{
                style: {
                  maxWidth: 500,
                },
              }}
            />
            <RouterProvider router={router} />
          </Box>
        </CssVarsProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default App;
