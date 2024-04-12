import { useAuth0 } from "@auth0/auth0-react";
import { AUTH0_AUDIENCE } from "../constants";
import { axiosInstance } from "./base";

export const useAxios = () => {
  const { getAccessTokenSilently } = useAuth0();

  axiosInstance.interceptors.request.use(async (config) => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: AUTH0_AUDIENCE },
    });
    if (typeof config.headers.Authorization === "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV !== "production") {
      // This header prevents ngrok checks.
      // https://stackoverflow.com/a/74475611
      config.headers["ngrok-skip-browser-warning"] = "any";
    }
    return config;
  });

  return axiosInstance;
};
