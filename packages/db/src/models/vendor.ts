import { Vendor } from "../schemas/vendor";
import { IVendor } from "../types";
import { BaseModel } from "./base";

export const vendorModel = new BaseModel(Vendor);

export const seedVendors = async () => {
  const vendorsData = [
    {
      name: "Slack",
      description:
        "Slack is a messaging app for business that connects people to the information they need.",
    },
    {
      name: "PagerDuty",
      description:
        "PagerDuty is a cloud-based platform that provides incident response, on-call scheduling, and DevOps monitoring services",
    },
    {
      name: "Opsgenie",
      description:
        "Opsgenie is a modern incident management and alerting tool that helps organizations respond to and resolve incidents quickly",
    },
    {
      name: "Coralogix",
      description:
        "Coralogix is a log analytics and monitoring platform designed to help organizations manage and analyze their log data more effectively",
    },
    {
      name: "DataDog",
      description:
        "DataDog is a cloud-based monitoring and analytics platform that provides visibility into the performance of applications, infrastructure, and networks through a unified dashboard.",
    },
    {
      name: "Github",
      description:
        "GitHub is a web-based platform that provides hosting for version control using Git",
    },
    {
      name: "Notion",
      description:
        "Notion is an all-in-one collaborative workspace platform that integrates note-taking, document sharing, project management, and database functionalities",
    },
    {
      name: "Jira",
      description:
        "Jira is a web-based platform that provides project management, issue tracking, and document sharing capabilities",
    },
    {
      name: "Confluence",
      description:
        "Confluence is a content management platform that provides document sharing, collaboration, and project management capabilities",
    },
    {
      name: "MongoDB",
      description:
        "MongoDB is a document database that provides a flexible and scalable solution for storing and retrieving data",
    },
    {
      name: "Grafana",
      description:
        "Grafana is a cloud-based monitoring and analytics platform that provides visibility into the performance of applications, infrastructure, and networks through a unified dashboard.",
    },
    {
      name: "Jaeger",
      description:
        "Jaeger is a tracing platform that helps monitoring and troubleshooting problems in distributed systems",
    },
    {
      name: "Prometheus",
      description:
        "Prometheus is an open-source monitoring and alerting system that provides visibility into the performance of applications, infrastructure, and more.",
    },
    {
      name: "Alert Manager",
      description:
        "Prometheus Alertmanager is the alerting component of the Prometheus monitoring system. It routes and manages alerts from Prometheus monitoring system to various receivers.",
    },
  ] as IVendor[];

  for (const vendor of vendorsData) {
    await Vendor.findOneAndUpdate({ name: vendor.name }, vendor, {
      upsert: true,
    });
  }
};
