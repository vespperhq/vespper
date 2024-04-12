import React from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import "./App.css";
import {
  AUTH0_AUDIENCE,
  AUTH0_CALLBACK_URL,
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
} from "./constants";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { Box } from "@mui/joy";

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
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: AUTH0_CALLBACK_URL,
        audience: AUTH0_AUDIENCE,
      }}
    >
      <QueryClientProvider client={queryClient}>
        {showDevtools && (
          <React.Suspense fallback={null}>
            <ReactQueryDevtoolsProduction />
          </React.Suspense>
        )}
        <CssVarsProvider>
          <CssBaseline />
          <Box sx={{ display: "flex", height: "100%" }}>
            <Toaster />
            <RouterProvider router={router} />
          </Box>
        </CssVarsProvider>
      </QueryClientProvider>
    </Auth0Provider>
  );
}

export default App;
