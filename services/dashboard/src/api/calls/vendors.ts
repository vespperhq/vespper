import { AxiosInstance } from "axios";
import { Vendor } from "../../types/Connections";

export const getAllVendors = async (
  axios: AxiosInstance,
): Promise<Vendor[] | undefined> => {
  try {
    const response = await axios.get("/vendors");
    return response.data;
  } catch (error) {
    console.log("getAllVendors error: ", error);
    throw error;
  }
};
