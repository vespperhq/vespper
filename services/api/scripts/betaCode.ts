import { connectToDB } from "../src/db";
import { betaCodeModel } from "../src/db/models/beta-code";
import { v4 as uuid } from "uuid";

(async () => {
  await connectToDB(process.env.MONGO_URI as string);

  const code = uuid();
  await betaCodeModel.create({ code, status: "new" });
  console.log(code);
  process.exit(1);
})();
