/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConnectionName } from "../../types/Connections";
import { SiNotion, SiPagerduty } from "react-icons/si";
import { FaGithub } from "react-icons/fa";
import SlackLogo from "../../assets/logo-slack.png";
import OpsgenieLogo from "../../assets/logo-opsgenie.png";
import DataDogLogo from "../../assets/logo-datadog.png";
import GrafanaLogo from "../../assets/logo-grafana.png";
import JaegerLogo from "../../assets/logo-jaeger.png";
import ConfluenceLogo from "../../assets/logo-confluence.png";
import JiraLogo from "../../assets/logo-jira.png";
import MongoDBLogo from "../../assets/logo-mongodb.png";
import PrometheusLogo from "../../assets/logo-prometheus.png";

export const icons = {
  [ConnectionName.Prometheus]: ({ style = {} }: any) => (
    <img src={PrometheusLogo} style={style} />
  ),
  [ConnectionName.Jaeger]: ({ style = {} }: any) => (
    <img src={JaegerLogo} style={style} />
  ),
  [ConnectionName.Grafana]: ({ style = {} }: any) => (
    <img src={GrafanaLogo} style={style} />
  ),
  [ConnectionName.DataDog]: ({ style = {} }: any) => (
    <img src={DataDogLogo} style={style} />
  ),
  [ConnectionName.Github]: FaGithub,
  [ConnectionName.Coralogix]: ({ style = {} }: any) => (
    <div
      style={{
        backgroundColor: "#3dc48f",
        borderRadius: "50%",
        width: "30px",
        height: "30px",
        ...style,
      }}
    ></div>
  ),
  [ConnectionName.Opsgenie]: ({ style = {} }: any) => (
    <img src={OpsgenieLogo} style={style} />
  ),
  [ConnectionName.Slack]: ({ style = {} }: any) => (
    <img src={SlackLogo} style={style} />
  ),
  [ConnectionName.PagerDuty]: ({ style = {} }: any) => (
    <SiPagerduty
      style={{
        padding: "6px",
        color: "white",
        backgroundColor: "#048a24",
        borderRadius: "4px",
        ...style,
      }}
    />
  ),
  [ConnectionName.Notion]: SiNotion,
  [ConnectionName.Confluence]: ({ style = {} }: any) => (
    <img src={ConfluenceLogo} style={style} />
  ),
  [ConnectionName.Jira]: ({ style = {} }: any) => (
    <img src={JiraLogo} style={style} />
  ),
  [ConnectionName.MongoDB]: ({ style = {} }: any) => (
    <img
      src={MongoDBLogo}
      style={{ ...style, width: "auto", height: style.height }}
    />
  ),
};
