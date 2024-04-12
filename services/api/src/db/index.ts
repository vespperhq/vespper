import mongoose from "mongoose";
import { seedVendors } from "./models/vendor";
import { seedPlans } from "./models/plan";

export const connectToDB = async (mongoUri: string) => {
  await mongoose.connect(mongoUri);
  console.log("Connected to DB!");

  // Seed vendors & plans
  await Promise.all([seedVendors(), seedPlans()]);
};

export const disconnectFromDB = async () => {
  await mongoose.disconnect();
  console.log("Disconnected from DB!");
};
