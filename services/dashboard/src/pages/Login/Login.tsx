import { useEffect } from "react";
import { Loader } from "../../components/Loader";
import { useSession } from "../../hooks/useSession";
import { ORY_URL } from "../../constants";

const LoginPage = () => {
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && !session) {
      window.location.href = `${ORY_URL}/self-service/login/browser`;
    }
  }, [session, loading]);

  if (loading) {
    return <Loader />;
  }
  return null;
};

export { LoginPage };
