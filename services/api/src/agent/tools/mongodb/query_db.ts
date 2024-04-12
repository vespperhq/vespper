import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { MongoClient, Db } from "mongodb";
import { MongoDBIntegration } from "../../../types";

export default async function (integration: MongoDBIntegration) {
  const { dbUrl } = integration.credentials;
  const client = new MongoClient(dbUrl);

  return new DynamicStructuredTool({
    name: "query_mongo_db",
    description: `Queries a MongoDB database, given a collection name and a query.`,
    func: async ({ collectionName, query = {} }) => {
      try {
        await client.connect();
        const database: Db = client.db();
        const model = database.collection(collectionName);

        const results = await model
          .find(query, { projection: { _id: 0 } })
          .toArray();

        return JSON.stringify(results);
      } finally {
        await client.close();
      }
    },
    schema: z.object({
      collectionName: z
        .string()
        .describe("The name of the collection you wish to query."),
      query: z
        .any()
        .optional()
        .describe(
          "The query you wish to run. Should be a valid MongoDB query. Omit this field to query all documents in the collection.",
        ),
    }),
  });
}
