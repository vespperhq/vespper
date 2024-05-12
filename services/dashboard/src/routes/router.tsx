import { createBrowserRouter } from "react-router-dom";
import {
  LoginPage,
  HomePage,
  CallbackPage,
  ChatPage,
  OrganizationGeneralPage,
  OrganizationMembersPage,
  OrganizationIntegrationsPage,
  OrgIndexPage,
  // OrganizationPlansPage,
  OrganizationWebhooksPage,
  OrganizationKnowledgeGraphPage,
} from "../pages";
import { AuthenticationGuard } from "./auth";
import * as paths from "./paths";
import { GenericLayout, OrganizationLayout } from "../layouts";
import { SupportPage } from "../pages/Support";

export const router = createBrowserRouter([
  {
    element: <GenericLayout />,
    children: [
      {
        path: paths.HOME_PATH,
        element: <AuthenticationGuard component={HomePage} />,
      },
      {
        path: paths.CHAT_PATH,
        element: <AuthenticationGuard component={ChatPage} />,
      },
      {
        path: paths.SUPPORT_PATH,
        element: <AuthenticationGuard component={SupportPage} />,
      },
      {
        path: paths.ORGANIZATION_PATH,
        element: <OrganizationLayout />,
        children: [
          {
            index: true,
            element: <AuthenticationGuard component={OrgIndexPage} />,
          },
          {
            path: paths.ORGANIZATION_GENERAL_PATH,
            element: (
              <AuthenticationGuard component={OrganizationGeneralPage} />
            ),
          },
          {
            path: paths.ORGANIZATION_MEMBERS_PATH,
            element: (
              <AuthenticationGuard component={OrganizationMembersPage} />
            ),
          },
          {
            path: paths.ORGANIZATION_INTEGRATIONS_PATH,
            element: (
              <AuthenticationGuard component={OrganizationIntegrationsPage} />
            ),
          },
          {
            path: paths.ORGANIZATION_WEBHOOKS_PATH,
            element: (
              <AuthenticationGuard component={OrganizationWebhooksPage} />
            ),
          },
          // {
          //   path: paths.ORGANIZATION_PLAN_PATH,
          //   element: <AuthenticationGuard component={OrganizationPlansPage} />,
          // },
          {
            path: paths.ORGANIZATION_KNOWLEDGE_GRAPH_PATH,
            element: (
              <AuthenticationGuard component={OrganizationKnowledgeGraphPage} />
            ),
          },
        ],
      },
    ],
  },
  {
    children: [
      {
        path: paths.LOGIN_PATH,
        element: <LoginPage />,
      },
      {
        path: paths.CALLBACK_PATH,
        element: <AuthenticationGuard component={CallbackPage} />,
      },
    ],
  },
]);
