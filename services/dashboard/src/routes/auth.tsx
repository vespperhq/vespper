import React from "react";
import { Loader } from "../components/Loader";
import { useSession } from "../hooks/useSession";
import { Navigate } from "react-router-dom";

interface Props {
  component: React.ComponentType<object>;
}

function AuthenticationGuard({ component: Component, ...props }: Props) {
  const { session, loading } = useSession();

  if (loading) {
    return <Loader />;
  } else if (!session) {
    return <Navigate to="/login" />;
  }

  return <Component {...props} />;
}

export { AuthenticationGuard };
