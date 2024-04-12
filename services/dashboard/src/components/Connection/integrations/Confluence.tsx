import {
  ATLASSIAN_CLIENT_ID,
  API_SERVER_URL,
  API_TUNNEL_URL,
} from "../../../constants";
import { ConnectionProps } from "../../../types/Connections";
import { ConnectionWrapper, OrderedList } from "../styles";

export const ConnectConfluenceIntegration = ({
  orgId,
  data,
}: ConnectionProps) => {
  const apiUrl =
    process.env.NODE_ENV === "development" ? API_TUNNEL_URL : API_SERVER_URL;
  const redirect_uri = `${apiUrl}/oauth/atlassian/callback`;
  return (
    <ConnectionWrapper>
      <OrderedList style={{ marginTop: 10 }}>
        <li>
          Install the Merlinn Confluence integration by clicking{" "}
          <a
            href={`https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${ATLASSIAN_CLIENT_ID}&scope=offline_access%20read%3Aconfluence-space.summary%20read%3Aconfluence-props%20read%3Aconfluence-content.all%20read%3Aconfluence-content.summary%20read%3Aconfluence-content.permission&redirect_uri=${redirect_uri}&state=${orgId}&response_type=code&prompt=consent`}
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
