import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/inter";
import "./index.css";
import { SHOULD_MOCK_API } from "./constants.ts";
import { mockAll } from "./api/mocks.ts";
import { StyledEngineProvider } from "@mui/joy/styles";

if (SHOULD_MOCK_API) {
  mockAll();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <App />
    </StyledEngineProvider>
  </React.StrictMode>,
);
