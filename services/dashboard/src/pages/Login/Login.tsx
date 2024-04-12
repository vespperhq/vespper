import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect } from "react";

const LoginPage = () => {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = useCallback(() => {
    return loginWithRedirect({
      appState: {
        returnTo: "/",
      },
    });
  }, [loginWithRedirect]);

  useEffect(() => {
    handleLogin();
  }, [handleLogin]);

  return null;
};

export { LoginPage };
