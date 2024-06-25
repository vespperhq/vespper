import { AxiosInstance } from "axios";

export const getIntegrations = async (axios: AxiosInstance) => {
  try {
    const response = await axios.get("/integrations");
    return response.data;
  } catch (error) {
    console.log("getIntegrations error: ", error);
    throw error;
  }
};

export const deleteIntegration = async (
  axios: AxiosInstance,
  integrationId: string,
) => {
  try {
    const response = await axios.delete(`/integrations/${integrationId}`);
    return response.data;
  } catch (error) {
    console.log("deleteIntegration error: ", error);
    throw error;
  }
};
