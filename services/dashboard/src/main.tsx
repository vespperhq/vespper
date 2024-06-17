import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/inter";
import "./index.css";
import { SHOULD_MOCK_API } from "./constants.ts";
import { mockAll } from "./api/mocks.ts";
import { StyledEngineProvider } from "@mui/joy/styles";
import { isEnterprise } from "./utils/ee.ts";

if (SHOULD_MOCK_API) {
  mockAll();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      {/* TODO: Remove this condition once our managed solution works well with Ory Cloud */}
      {isEnterprise() ? <div>We're under maintenance. Sorry</div> : <App />}
    </StyledEngineProvider>
  </React.StrictMode>,
);
