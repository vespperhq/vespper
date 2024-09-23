import {
  API_SERVER_URL,
  API_TUNNEL_URL,
  GITHUB_CLIENT_ID,
} from "../../../../constants";
import { ConnectionProps } from "../../../../types/Connections";
import { ConnectionWrapper, OrderedList } from "../../styles";

export const ConnectGithubIntegration = ({ orgId, data }: ConnectionProps) => {
  const apiUrl =
    process.env.NODE_ENV === "development" ? API_TUNNEL_URL : API_SERVER_URL;
  const redirect_uri = `${apiUrl}/oauth/github/callback`;
  return (
    <ConnectionWrapper>
      <OrderedList style={{ marginTop: 0 }}>
        <li>
          Authorize Merlinn Github App through{" "}
          <a
            href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&state=${orgId}&redirect_uri=${redirect_uri}`}
            target="_blank"
          >
            this
          </a>{" "}
          link.
        </li>
        <li>
          Install Merlinn Github app on your desired organizations through{" "}
          <a
            href="https://github.com/apps/vespper-app/installations/select_target"
            target="_blank"
          >
            this
          </a>{" "}
          link.
        </li>
      </OrderedList>
      {!data && 'When you finish click the "Connect" button'}
    </ConnectionWrapper>
  );
};
