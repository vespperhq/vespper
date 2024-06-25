import React, { createContext, useEffect, useState } from "react";
import { FrontendApi, Configuration, Session } from "@ory/client";
import { ORY_URL } from "../constants";

const basePath = ORY_URL;
export const ory = new FrontendApi(
  new Configuration({
    basePath,
    baseOptions: {
      withCredentials: true,
    },
  }),
);

export interface AppSession {
  logoutUrl: string | undefined;
  session: Session | undefined;
  loading: boolean;
}
export const SessionContext = createContext<AppSession>({
  logoutUrl: undefined,
  session: undefined,
  loading: true,
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | undefined>();
  const [logoutUrl, setLogoutUrl] = useState<string | undefined>();

  useEffect(() => {
    ory
      .toSession()
      .then(({ data }) => {
        // User has a session!
        setSession(data);
        ory.createBrowserLogoutFlow().then(({ data }) => {
          // Get also the logout url
          setLogoutUrl(data.logout_url);
        });
      })
      .catch((err) => {
        console.log("No session found", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Render the provider with the session object as the value
  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
        logoutUrl,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
