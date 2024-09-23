export const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL as string;
export const API_TUNNEL_URL = import.meta.env.VITE_API_TUNNEL_URL as string;
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
export const SLACK_CLIENT_ID = import.meta.env.VITE_SLACK_CLIENT_ID as string;
export const NOTION_CLIENT_ID = import.meta.env.VITE_NOTION_CLIENT_ID as string;
export const ATLASSIAN_CLIENT_ID = import.meta.env
  .VITE_ATLASSIAN_CLIENT_ID as string;
export const PAGER_DUTY_CLIENT_ID = import.meta.env
  .VITE_PAGER_DUTY_CLIENT_ID as string;

export const ORY_URL = import.meta.env.VITE_ORY_URL as string;
export const VESPPER_CLOUD_REGION = import.meta.env
  .VITE_VESPPER_CLOUD_REGION as string;

// JSON.parse transforms "true"/"false" to native types true/false.
export const SHOULD_MOCK_API = import.meta.env.VITE_MOCK_API_CALLS
  ? JSON.parse(import.meta.env.VITE_MOCK_API_CALLS)
  : false;

// Turn this on in order to show the chat page.
export const SHOW_CHAT_PAGE = false;
