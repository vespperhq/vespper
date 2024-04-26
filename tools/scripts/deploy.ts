import { program } from "commander";
import { spawn } from "child_process";
import fs from "fs";

program.arguments("<service_names...>");
program.parse();

const serviceNames = program.args;

function execCommand(command: string) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, {
      stdio: "pipe",
      shell: true,
      env: {
        ...process.env,
      },
    });

    let stdoutData = "";
    let stderrData = "";
    childProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });
    childProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    childProcess.on("error", (error) => {
      reject(error);
    });
    childProcess.on("exit", (code) => {
      if (code === 0) {
        resolve(stdoutData.trim());
      } else {
        reject(
          new Error(`Command exited with code ${code}. Output: ${stderrData}`),
        );
      }
    });
  });
}

function getImageTag(serviceName: string) {
  return execCommand(
    `docker images --filter "reference=europe-west2-docker.pkg.dev/merlinn/production/${serviceName}" --format "{{.Repository}}:{{.Tag}}"`,
  );
}

async function deployImage(serviceName: string) {
  console.log(`Deploying ${serviceName}...`);
  const imageTag = await getImageTag(serviceName);
  console.log(`Image tag: ${imageTag}`);
  return execCommand(
    `gcloud run deploy ${serviceName} --image ${imageTag} --region europe-west2`,
  );
}

(async () => {
  for (const serviceName of serviceNames) {
    await deployImage(serviceName);
  }
})();
