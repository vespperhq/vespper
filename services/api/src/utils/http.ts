import axios from "axios";

export const downloadFile = async (url: string) => {
  try {
    const response = await axios.get(url, { responseType: "blob" });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
