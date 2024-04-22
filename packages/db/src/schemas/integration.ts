import mongoose from "mongoose";
import { IIntegration } from "../types";

const Schema = mongoose.Schema;

const IntegrationSchema = new Schema<IIntegration>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    credentials: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed,
    settings: Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const Integration = mongoose.model("Integration", IntegrationSchema);
