import MockAdapter from "axios-mock-adapter";
import { axiosInstance } from "./base";

export const mockGetIntegrations = (mockAdapter: MockAdapter) => {
  mockAdapter.onGet(/integrations\?.*/).reply(200, [
    {
      name: "pagerduty",
      description: "a wonderful incident management tool",
    },
    {
      name: "slack",
      description: "a wonderful messaging tool",
    },
  ]);
};

export const mockAll = () => {
  const mockAdapter = new MockAdapter(axiosInstance);
  mockGetIntegrations(mockAdapter);
};
