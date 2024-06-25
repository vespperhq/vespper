import { Navigate } from "react-router-dom";
import * as paths from "../../routes/paths";

// This component is nice in case we'd want to ask the user to fill
// additional stuff after they sign up. For example, to fill up their
// organization name or to update further details in its user profile.
function CallbackPage() {
  return <Navigate to={paths.ORGANIZATION_PATH} />;
}

export { CallbackPage };
