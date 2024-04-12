import mongoose from "mongoose";
import { IOrganization } from "../../types";

const Schema = mongoose.Schema;

export const OrganizationSchema = new Schema<IOrganization>(
  {
    name: String,
    plan: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
    },
  },
  { timestamps: true },
);

export const Organization = mongoose.model("Organization", OrganizationSchema);
