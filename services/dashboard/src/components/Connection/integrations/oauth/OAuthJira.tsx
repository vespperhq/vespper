import {
  ATLASSIAN_CLIENT_ID,
  API_TUNNEL_URL,
  API_SERVER_URL,
} from "../../../../constants";
import { ConnectionProps } from "../../../../types/Connections";
import { ConnectionWrapper, OrderedList } from "../../styles";

export const ConnectJiraIntegration = ({ orgId, data }: ConnectionProps) => {
  const apiUrl =
    process.env.NODE_ENV === "development" ? API_TUNNEL_URL : API_SERVER_URL;
  const redirect_uri = `${apiUrl}/oauth/atlassian/callback`;
  return (
    <ConnectionWrapper>
      <OrderedList style={{ marginTop: 10 }}>
        <li>
          Install the Vespper Jira integration by clicking{" "}
          <a
            href={`https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${ATLASSIAN_CLIENT_ID}&scope=offline_access%20read%3Ajira-work&redirect_uri=${redirect_uri}&state=${orgId}&response_type=code&prompt=consent`}
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
