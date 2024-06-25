import { AxiosInstance } from "axios";

export const getUser = async (axios: AxiosInstance) => {
  try {
    const response = await axios.get("/users/me");
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getOrgUsers = async (
  axios: AxiosInstance,
  organizationId: string,
) => {
  try {
    const response = await axios.get(`/users?organizationId=${organizationId}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteUser = async (axios: AxiosInstance, id: string) => {
  try {
    const response = await axios.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
