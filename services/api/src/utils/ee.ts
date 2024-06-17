export function isEnterprise() {
  return !!process.env.MERLINN_CLOUD_REGION;
}
