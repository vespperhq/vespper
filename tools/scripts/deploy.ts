import { program } from "commander";
import { spawn } from "child_process";
import fs from "fs";

program.arguments("<service_names...>");
program.parse();

const serviceNames = program.args;

function execCommand(command: string) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
      },
    });
    childProcess.on("error", (error) => {
      reject(error);
    });
    childProcess.on("exit", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command exited with code ${code}.`));
      }
    });
  });
}

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

(async () => {
  for (const serviceName of serviceNames) {
    console.log(`Deploying ${serviceName}...`);
    const envVars = collectEnvVars(serviceName);
    injectEnvVars(serviceName, envVars);

    await execCommand("gcloud app deploy app.yaml --quiet");
  }
})();
