import mongoose from "mongoose";
import { IPlan } from "../types";

const Schema = mongoose.Schema;

export const PlanSchema = new Schema<IPlan>(
  {
    name: String,
    fields: [
      {
        type: Schema.Types.ObjectId,
        ref: "PlanField",
      },
    ],
    values: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

export const Plan = mongoose.model("Plan", PlanSchema);
