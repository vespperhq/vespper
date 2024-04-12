import {
  PAGER_DUTY_CLIENT_ID,
  API_SERVER_URL,
  API_TUNNEL_URL,
} from "../../../constants";
import { ConnectionProps } from "../../../types/Connections";
import { ConnectionWrapper, OrderedList } from "../styles";

export const ConnectPageDutyIntegration = ({
  orgId,
  data,
}: ConnectionProps) => {
  const apiUrl =
    process.env.NODE_ENV === "development" ? API_TUNNEL_URL : API_SERVER_URL;
  const redirect_uri = `${apiUrl}/oauth/pagerduty/callback`;
  const authUrl = `https://identity.pagerduty.com/oauth/authorize?client_id=${PAGER_DUTY_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code&state=${orgId}`;
  return (
    <ConnectionWrapper>
      <OrderedList style={{ marginTop: 10 }}>
        <li>
          Authorize PageDuty through{" "}
          <a href={authUrl} target="_blank">
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
