export function isEnterprise() {
  return !!process.env.VESPPER_CLOUD_REGION;
}

export function isLangfuseEnabled() {
  return (
    !!process.env.LANGFUSE_SECRET_KEY &&
    !!process.env.LANGFUSE_PUBLIC_KEY &&
    !!process.env.LANGFUSE_HOST
  );
}
