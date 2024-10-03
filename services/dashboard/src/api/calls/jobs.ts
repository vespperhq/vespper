import { AxiosInstance } from "axios";

interface Job {
  id: string;
  type: string;
  status: "pending" | "completed" | "failed";
  phase: string;
  createdAt: string;
  updatedAt: string;
}

export const getJobs = async (
  axios: AxiosInstance,
  organization: string,
  type: string,
  status: string,
): Promise<Job[]> => {
  try {
    const response = await axios.get("/jobs", {
      params: { organization, type, status },
    });
    return response.data;
  } catch (error) {
    console.log("getJobs error: ", error);
    throw error;
  }
};
