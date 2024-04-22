import { runAgent } from "../src/agent";
import { chatModel } from "../src/agent/model";
import { investigationTemplate } from "../src/agent/prompts";
import { connectToDB, integrationModel, organizationModel } from "@merlinn/db";
import type { IIntegration } from "@merlinn/db";
import type { RunContext } from "../src/agent/types";

(async () => {
  await connectToDB(process.env.MONGO_URI as string);

  const organizationId = "65f87ee82ffc9016e61c3644";
  const organization = await organizationModel.getOneById(organizationId);
  const integrations = (await integrationModel
    .get({
      organization: organizationId,
    })
    .populate("vendor")) as IIntegration[];
  const prompt = `
  You are a smart AI assistant called Merlinn. Your mission is to investigate incidents in Production
  and provide an initial report to the responders.
  Use the tools at your disposal to fetch information about the problem.
  Always go as deep as possible in your investigation. Think like a human on-call engineer.
  Often findings can be linked together to form a bigger picture.

  Tips for the investigation:
  * Check logs/metrics for clues
  * Check whether there were recent code changes
  
  Notes:
  * Talk as if you are a team member, helping with the incident. Don't talk like your are an assistant.
  
  Begin!

New alert has been triggered! Details:

  Title: [Coralogix] User could not pay
  Source: PagerDuty
  Time: 4 hours ago
  Additional information:  
  {
    "cx_rum": {
      "session_context": {
        "ip_geoip": {
          "ip": "46.120.47.34",
          "ip_ipaddr": "46.120.47.34",
          "location_geopoint": { "lat": 32.0717, "lon": 34.8153 },
          "continent_name": "Asia",
          "country_name": "Israel",
          "city_name": "Giv‘atayim",
          "postal_code": null
        },
        "browser": "Chrome",
        "browserVersion": "121.0.0.0",
        "device": "Desktop",
        "ip": "46.120.47.34",
        "os": "Windows",
        "osVersion": "10.0",
        "session_creation_date": 1707168213512,
        "session_id": "198f3d38-f4db-4a43-8998-dfb5f813282c",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "user_email": "test@test.com",
        "user_id": "65bf9c265dfb3e4070316a83",
        "user_name": "65bf9c265dfb3e4070316a83",
        "x_forwarded_for": "46.120.47.34"
      },
      "browser_sdk": { "version": "1.0.56" },
      "environment": "",
      "event_context": { "severity": 6, "source": "code", "type": "log" },
      "labels": {},
      "log_context": {
        "data": { "error": "Unknown error" },
        "message": "User could not pay"
      },
      "page_context": {
        "page_fragments": "checkout",
        "page_url": "http://localhost:5173/#/checkout"
      },
      "spanId": "ef2f076e5847f9cb",
      "timestamp": 1707170222097,
      "traceId": "a0511fb52f63294561fe9eac9772c6bd",
      "version_metadata": { "app_name": "demo-app", "app_version": "1.0" },
      "rum_template_id": "67302d96ceb8055edcd3ae4f1ccb1c6d26db293321b967f97846dcba0a2cdc37"
    }
  }
  
  `;

  const callback = async (answer: string) => {
    console.log(answer);
  };

  const context: RunContext = {
    organizationName: organization!.name,
    organizationId,
    env: process.env.NODE_ENV as string,
    eventId: "local-alert",
    context: "trigger-local-script",
  };

  await runAgent({
    prompt,
    template: investigationTemplate,
    model: chatModel,
    integrations,
    callback,
    context,
  });
})();
