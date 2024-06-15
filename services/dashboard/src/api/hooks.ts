import { axiosInstance } from "./base";

export const useAxios = () => {
  axiosInstance.interceptors.request.use(async (config) => {
    if (process.env.NODE_ENV !== "production") {
      // This header prevents ngrok checks.
      // https://stackoverflow.com/a/74475611
      config.headers["ngrok-skip-browser-warning"] = "any";
    }
    return config;
  });

  return axiosInstance;
};
