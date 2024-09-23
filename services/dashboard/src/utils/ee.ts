import { VESPPER_CLOUD_REGION } from "../constants";

export function isEnterprise() {
  return !!VESPPER_CLOUD_REGION;
}
