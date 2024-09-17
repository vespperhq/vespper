import { useContext } from "react";
import { SessionContext } from "../providers/auth";
import { Session } from "@ory/client";

const getName = (session: Session | undefined) => {
  if (session?.identity?.traits.name) {
    const { first, last } = session!.identity!.traits.name;
    return `${first} ${last}`;
  }

  return undefined;
};

const getEmail = (session: Session | undefined) => {
  return session?.identity?.traits?.email;
};

export const useSession = () => {
  const { session, logoutUrl, loading } = useContext(SessionContext);

  const name = getName(session);
  const email = getEmail(session);

  const logout = async () => {
    window.location.href = logoutUrl!;
  };

  return { session, name, email, logout, loading };
};
