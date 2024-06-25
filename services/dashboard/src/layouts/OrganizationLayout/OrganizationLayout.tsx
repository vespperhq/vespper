import { Navigate, Outlet } from "react-router-dom";
import { HOME_PATH } from "../../routes/paths";
import { Loader } from "../../components/Loader";
import { useMe } from "../../api/queries/auth";

const OrganizationLayout = () => {
  const { data: user, isPending } = useMe();

  if (isPending) {
    return <Loader />;
  } else if (user?.role === "member") {
    return <Navigate to={HOME_PATH} />;
  }

  return <Outlet />;
};

export { OrganizationLayout };
