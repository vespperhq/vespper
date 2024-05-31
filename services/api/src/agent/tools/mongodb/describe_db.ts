import { DynamicTool } from "langchain/tools";
import { MongoClient, Db, WithId, Document } from "mongodb";
import type { MongoDBIntegration } from "@merlinn/db";
import util from "util";

interface CollectionInfo {
  name: string;
  fields: string[];
  count: number;
}

const ANSWER_FORMAT = `Here is a summary of the MongoDB database:
DB name: %s
Collections Information:
%s
`;

export default async function (integration: MongoDBIntegration) {
  const { dbUrl } = integration.credentials;
  const client = new MongoClient(dbUrl);

  return new DynamicTool({
    name: "describe_mongo_db",
    description: `Describes the MongoDB database. Namely, the collections and their fields.`,
    func: async () => {
      try {
        await client.connect();
        const database: Db = client.db();

        const collections = await database.listCollections().toArray();

        const collectionsData: CollectionInfo[] = [];
        for (const collection of collections) {
          const { name } = collection;
          const model = database.collection(name);

          const sample = (await model.findOne(
            {},
            { projection: { _id: 0 } },
          )) as WithId<Document>;
          const fields = Object.keys(sample);
          const count = await model.countDocuments();
          collectionsData.push({
            name,
            fields,
            count,
          });
        }

        return util.format(
          ANSWER_FORMAT,
          database.databaseName,
          JSON.stringify(collectionsData, null, 2),
        );
      } finally {
        await client.close();
      }
    },
  });
}
