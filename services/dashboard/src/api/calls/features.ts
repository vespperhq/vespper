import { AxiosInstance } from "axios";

interface Features {
  isInviteMembersEnabled: boolean;
}

export const getFeatures = async (axios: AxiosInstance) => {
  try {
    const response = await axios.get<Features>("/features");
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
