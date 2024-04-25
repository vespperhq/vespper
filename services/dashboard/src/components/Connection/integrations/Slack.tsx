import {
  SLACK_CLIENT_ID,
  API_SERVER_URL,
  API_TUNNEL_URL,
} from "../../../constants";
import { ConnectionProps } from "../../../types/Connections";
import { ConnectionWrapper, OrderedList } from "../styles";

const scopes = [
  "app_mentions:read",
  "channels:history",
  "channels:join",
  "channels:read",
  "chat:write",
  "files:read",
  "im:history",
  "incoming-webhook",
  "metadata.message:read",
  "reactions:read",
  "reactions:write",
  "users.profile:read",
  "users:read",
  "users:read.email",
  // "commands",
  // "groups:history",
  // "mpim:history",
];
export const ConnectSlackIntegration = ({ orgId, data }: ConnectionProps) => {
  const apiUrl =
    process.env.NODE_ENV === "development" ? API_TUNNEL_URL : API_SERVER_URL;
  return (
    <ConnectionWrapper>
      <OrderedList style={{ marginTop: 10 }}>
        <li>
          Install the Merlinn Slack bot to the specific Slack channel where
          incident reports are received through{" "}
          <a
            href={`https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&state=${orgId}&redirect_uri=${apiUrl}/oauth/slack/callback&scope=${scopes.join(",")}`}
            target="_blank"
          >
            this
          </a>{" "}
          link.
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
