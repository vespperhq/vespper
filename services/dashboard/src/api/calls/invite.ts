import { AxiosInstance, AxiosResponse } from "axios";

interface OpsgenieUser {
  blocked: false;
  verified: true;
  id: string;
  username: string;
  fullName: string;
  role: {
    id: string;
    name: string;
  };
  timeZone: string;
  locale: string;
  userAddress: {
    country: string;
    state: string;
    city: string;
    line: string;
    zipCode: string;
  };
  createdAt: string;
}

export const inviteUsers = async (axios: AxiosInstance, emails: string[]) => {
  try {
    const response = await axios.post("/invite", { emails });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const importOpsgenieUsers = async (axios: AxiosInstance) => {
  try {
    const response = await axios.get<
      unknown,
      AxiosResponse<{ users: OpsgenieUser[] }>
    >(`/invite/import?source=Opsgenie`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
