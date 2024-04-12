import axios from "axios";
import { API_SERVER_URL } from "../constants";

export const axiosInstance = axios.create({
  baseURL: API_SERVER_URL,
});
