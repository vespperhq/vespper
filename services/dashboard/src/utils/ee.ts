import { MERLINN_CLOUD_REGION } from "../constants";

export function isEnterprise() {
  return !!MERLINN_CLOUD_REGION;
}
