import mongoose from "mongoose";
import { IIndex, VendorName } from "../../types";

const Schema = mongoose.Schema;

export const IndexSchema = new Schema<IIndex>(
  {
    name: String,
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    dataSources: [
      {
        type: String,
        enum: Object.values(VendorName),
      },
    ],
    state: {
      status: {
        type: String,
        enum: ["pending", "created", "failed"],
      },
      integrations: Schema.Types.Mixed,
    },
    stats: Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const Index = mongoose.model("Index", IndexSchema, "index");
