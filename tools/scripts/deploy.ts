import { join } from "path";
import { program } from "commander";
import { spawn } from "child_process";
import fs from "fs";

program.arguments("<service_names...>");
program.parse();

const serviceNames = program.args;

function getEnvPrefix(serviceName: string) {
  return serviceName.replace("-", "_").toUpperCase() + "_SERVICE";
}
function collectEnvVars(serviceName: string) {
  const envVarsPrefix = getEnvPrefix(serviceName);

  const envVars = Object.entries(process.env)
    .filter(([key]) => key.startsWith(envVarsPrefix))
    .reduce((total, [key, value]) => ({ ...total, [key]: value }), {});

  return envVars;
}

function injectEnvVars(serviceName: string, envVars: Record<string, string>) {
  const envVarsPrefix = getEnvPrefix(serviceName);

  let yamlContent = fs.readFileSync("app.yaml", "utf8");

  Object.entries(envVars).forEach(([key, value]) => {
    const strippedKey = key.replace(`${envVarsPrefix}_`, "");
    const placeholder = `$${strippedKey}`;
    yamlContent = yamlContent.replace(placeholder, value);
  });

  fs.writeFileSync("app.yaml", yamlContent, "utf8");
}

async function deployService(serviceName: string) {
  return new Promise((resolve, reject) => {
    const command = `gcloud`;
    const args = ["app", "deploy", "app.yaml", "--quiet"];

    const childProcess = spawn(command, args);
    childProcess.stdout.on("data", (data) => {
      console.log(data);
    });

    childProcess.stderr.on("data", (data) => {
      console.error(data);
    });

    childProcess.on("close", (code) => {
      resolve(code);
    });

    childProcess.on("error", (err) => {
      reject(err);
    });
  });
}
(async () => {
  for (const serviceName of serviceNames) {
    console.log(`Deploying ${serviceName}...`);
    const envVars = collectEnvVars(serviceName);
    injectEnvVars(serviceName, envVars);

    await deployService(serviceName);
  }
})();
