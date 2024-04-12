import { Box } from "@mui/joy";
import styled from "styled-components";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { Outlet } from "react-router-dom";

const Wrapper = styled(Box)`
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
`;

function GenericLayout() {
  return (
    <>
      <Header />
      <Sidebar />
      <Wrapper
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
        <main style={{ minHeight: "100%" }}>
          <Outlet />
        </main>
      </Wrapper>
    </>
  );
}

export { GenericLayout };
