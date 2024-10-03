import { AxiosInstance } from "axios";

export const getIndex = async (axios: AxiosInstance) => {
  try {
    const response = await axios.get("/index");
    return response.data;
  } catch (error) {
    console.log("getIndex error: ", error);
    throw error;
  }
};

export const createIndex = async (
  axios: AxiosInstance,
  body: { dataSources: string[] },
): Promise<{ status: { type: "pending" | "completed" | "failed" } }> => {
  try {
    const response = await axios.post("/index", body);

    return response.data;
  } catch (error) {
    console.log("createIndex error: ", error);
    throw error;
  }
};

export const deleteIndex = async (axios: AxiosInstance, indexId: string) => {
  try {
    const response = await axios.delete(`/index/${indexId}`);
    return response.data;
  } catch (error) {
    console.log("deleteIndex error: ", error);
    throw error;
  }
};
