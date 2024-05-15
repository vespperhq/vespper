import fs from "fs";
import { program } from "commander";

program.option(
  "-e, --embedding-model <embedding_model>",
  "What OpenAI embedding model you'd like to use",
);
program.argument("repo_path");
program.parse();

const args = program.args;
const opts = program.opts();

// $ usd/quantity of token
const EMBEDDING_PRICES: Record<string, [number, number]> = {
  "text-embedding-3-small": [0.02, 1000000],
  "text-embedding-3-large": [0.13, 1000000],
  "ada v2": [0.1, 1000000],
};

function countWordsInDirectory(directoryPath: string) {
  let totalCount = 0;

  // Read the contents of the directory
  const files = fs.readdirSync(directoryPath);

  files.forEach((file) => {
    const filePath = `${directoryPath}/${file}`;

    // Check if it's a file or directory
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      // If it's a file, read its contents and count words
      const content = fs.readFileSync(filePath, "utf8");
      const fileWordCount = content.trim().split(/\s+/).length;
      totalCount += fileWordCount;
    } else if (stats.isDirectory()) {
      // If it's a directory, recursively count words in it
      totalCount += countWordsInDirectory(filePath);
    }
  });

  return totalCount;
}

function countWordsInRepository(repositoryPath: string) {
  try {
    const totalWords = countWordsInDirectory(repositoryPath);
    console.log(`Total words in repository: ${totalWords}`);
    return totalWords;
  } catch (error) {
    console.error("Error counting words:", error);
    return null;
  }
}

(async () => {
  if (args.length === 0) {
    console.log("Repp path must be specified");
    process.exit(1);
  }

  const [repoPath] = args;
  const { embeddingModel } = opts;

  if (!EMBEDDING_PRICES[embeddingModel]) {
    console.log(
      `Invalid embedding model. Available options: ${Object.keys(EMBEDDING_PRICES).join(", ")}`,
    );
    process.exit(1);
  }

  const numberOfWords = countWordsInRepository(repoPath);
  if (!numberOfWords) {
    console.log("Failed to count words in repository");
    process.exit(1);
  }
  const numberOfTokens = numberOfWords * 1.3; // it's an approximation;

  const [price, quantity] = EMBEDDING_PRICES[embeddingModel];
  const cost = (numberOfTokens / quantity) * price;

  const formattedCost = Math.round(cost).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  console.log(`Cost of indexing this repo: $${formattedCost}`);
})();
