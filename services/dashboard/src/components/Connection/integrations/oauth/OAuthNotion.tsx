import {
  NOTION_CLIENT_ID,
  API_SERVER_URL,
  API_TUNNEL_URL,
} from "../../../../constants";
import { ConnectionProps } from "../../../../types/Connections";
import { ConnectionWrapper, OrderedList } from "../../styles";

export const ConnectNotionIntegration = ({ orgId, data }: ConnectionProps) => {
  const apiUrl =
    process.env.NODE_ENV === "development" ? API_TUNNEL_URL : API_SERVER_URL;
  const redirect_uri = `${apiUrl}/oauth/notion/callback`;
  return (
    <ConnectionWrapper>
      <OrderedList style={{ marginTop: 10 }}>
        <li>
          Install the Vespper Notion integration by clicking{" "}
          <a
            href={`https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${redirect_uri}&state=${orgId}`}
            target="_blank"
          >
            here
          </a>
          .
        </li>
      </OrderedList>
      {!data && (
        <span style={{ marginTop: "20px", fontSize: "0.8em" }}>
          When you finish click the "Connect" button
        </span>
      )}
    </ConnectionWrapper>
  );
};
