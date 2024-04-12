import { semanticSearch } from "../src/agent/rag";

(async () => {
  const indexName = "65f87ee82ffc9016e61c3644";
  const text = await semanticSearch(
    "Where is the logic that creates integrations?",
    indexName,
    5,
    true,
  );
  console.log(text);
  // console.log(response.matches[0].metadata);
})();
