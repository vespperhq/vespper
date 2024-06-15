import { Loader } from "../../components/Loader";
import { useSession } from "../../hooks/useSession";

const LoginPage = () => {
  const { session, loading } = useSession();

  if (loading) {
    return <Loader />;
  } else if (!session) {
    return <div>not authenticated</div>;
  }
  return <Loader />;
};

export { LoginPage };
