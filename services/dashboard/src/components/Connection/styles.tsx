import { Box } from "@mui/joy";
import Card from "@mui/joy/Card";
import styled from "styled-components";

export const CustomPaper = styled(Card)`
  padding: 20px;
  width: 250px;
  height: 300px;
  margin: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: start;
  text-align: start;
  justify-content: space-between;
`;

export const OrderedList = styled.ol`
  margin-top: 50px;
  padding-left: 24px;
`;

export const ConnectionWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const Null = styled.span``;
