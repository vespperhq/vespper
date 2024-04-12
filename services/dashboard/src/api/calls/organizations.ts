import { AxiosInstance } from "axios";
/* eslint-disable @typescript-eslint/no-explicit-any */

export const createOrganization = async (
  axios: AxiosInstance,
  organization: any,
) => {
  try {
    const response = await axios.post("/organizations", organization);
    return response.data;
  } catch (error) {
    console.log("createOrganization error: ", error);
    throw error;
  }
};

export const updateOrganization = async (
  axios: AxiosInstance,
  organization: any,
  orgId: string,
) => {
  try {
    const response = await axios.put(`/organizations/${orgId}`, {
      organization,
    });
    return response.data;
  } catch (error) {
    console.log("updateOrganization error: ", error);
    throw error;
  }
};

export const deleteOrganization = async (
  axios: AxiosInstance,
  orgId: string,
) => {
  try {
    const response = await axios.delete(`/organizations/${orgId}`);
    return response.data;
  } catch (error) {
    console.log("deleteOrganization error: ", error);
    throw error;
  }
};

export const getUsage = async (axios: AxiosInstance, orgId: string) => {
  try {
    const response = await axios.get(`/organizations/${orgId}/usage`);
    return response.data;
  } catch (error) {
    console.log("getUsage error: ", error);
    throw error;
  }
};
