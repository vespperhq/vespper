import { parseAlert } from "../alerts";
import type { EventSource } from "../../types/internal";
import {
  generateQueriesPrompt,
  investigationLeanTemplate,
  verifyDocumentPrompt,
} from "../../agent/prompts";
import { chatModel } from "../../agent/model";
import { getVectorStore, nodesToText } from "../../agent/rag";
import type { Document } from "../../agent/rag/types";
import { buildPrompt } from "../alerts/utils";
import { indexModel } from "@merlinn/db";
import type { IIndex } from "@merlinn/db";
import { JsonOutputParser } from "langchain/schema/output_parser";

async function generateQueries(
  incidentText: string,
  nQueries: number = 3,
): Promise<string[]> {
  const queriesPrompt = await generateQueriesPrompt.format({
    incident: incidentText,
    nQueries,
  });
  const parser = new JsonOutputParser();
  try {
    const { content } = await chatModel.invoke(queriesPrompt);
    const { queries } = await parser.parse(content as string);
    if (!queries || queries.length === 0) {
      throw new Error("No queries generated");
    }
    return queries;
  } catch (error) {
    console.error("Error generating queries", error);
    throw error;
  }
}

async function verifyDocument(
  incidentText: string,
  document: string,
): Promise<boolean> {
  const queriesPrompt = await verifyDocumentPrompt.format({
    incident: incidentText,
    document,
  });
  try {
    const { content } = await chatModel.invoke(queriesPrompt);
    const answer = (content as string).toLowerCase();

    // Since we ask the LLM to just generate true or false, we can just parse the response
    return JSON.parse(answer);
  } catch (error) {
    console.error("Error parsing the response", error);
    throw error;
  }
}

// This step is used as a reflectio step, to remove noise
async function filterDocuments(
  incidentText: string,
  documents: Document[],
): Promise<Document[]> {
  const verifications = await Promise.all(
    documents.map((doc) => verifyDocument(incidentText, doc.text)),
  );
  return documents.filter((_, index) => verifications[index]);
}

async function runQueries(
  index: IIndex,
  queries: string[],
): Promise<Document[]> {
  const vectorStore = getVectorStore(index.name, index.type);

  const documents = (
    await Promise.all(
      queries.map(async (query) => vectorStore.query({ query, topK: 3 })),
    )
  ).reduce((acc, val) => acc.concat(val), []);

  return documents;
}

async function runInvestigation(
  incidentText: string,
  context: string,
): Promise<string> {
  const investigationPrompt = await investigationLeanTemplate.format({
    incident: incidentText,
    context,
  });
  const { content } = await chatModel.invoke(investigationPrompt);
  return content as string;
}

export async function runAnalysis(
  eventId: string,
  eventSource: EventSource,
  organizationId: string,
) {
  const index = await indexModel.getOne({
    organization: organizationId,
  });
  if (!index) {
    throw new Error("Knowledge base is not set up. Analysis cannot be done.");
  }

  const event = await parseAlert(eventId, eventSource, organizationId);
  const incidentText = buildPrompt(event);

  // Phase 1 - Information retrieval phase from Vector DB
  const queries = await generateQueries(incidentText);
  const documents = await runQueries(index, queries);
  const filteredDocuments = await filterDocuments(incidentText, documents);

  const topDocuments = filteredDocuments
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const context = nodesToText(topDocuments);

  const analysis = await runInvestigation(incidentText, context);
  return analysis;
}
