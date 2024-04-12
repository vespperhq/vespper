import { withAuthenticationRequired } from "@auth0/auth0-react";
import React from "react";
import { Loader } from "../components/Loader";

interface Props {
  component: React.ComponentType<object>;
}

function AuthenticationGuard({ component }: Props) {
  const AuthWrapped = withAuthenticationRequired(component, {
    onRedirecting: Loader,
  });

  return <AuthWrapped />;
}

export { AuthenticationGuard };
