import { AxiosInstance } from "axios";

export const getWebhooks = async (axios: AxiosInstance) => {
  try {
    const response = await axios.get("/webhooks");
    return response.data;
  } catch (error) {
    console.log("getWebhooks error: ", error);
    throw error;
  }
};

export const createWebhook = async (
  axios: AxiosInstance,
  vendorName: string,
  organizationId: string,
  secret: string,
) => {
  try {
    const response = await axios.post("/webhooks", {
      organizationId,
      vendorName,
      secret,
    });
    return response.data;
  } catch (error) {
    console.log("createWebhook error: ", error);
    throw error;
  }
};
