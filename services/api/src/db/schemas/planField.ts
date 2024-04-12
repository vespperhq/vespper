import mongoose from "mongoose";
import { IPlanField } from "../../types";

const Schema = mongoose.Schema;

export const PlanFieldSchema = new Schema<IPlanField>(
  {
    name: String,
    code: String,
    kind: {
      type: String,
      enum: ["string", "number", "boolean"],
    },
    granularity: {
      type: String,
      enum: ["organization", "user"],
      required: true,
    },
    canExceedLimit: {
      type: Boolean,
      default: false,
      required: false,
    },
    resetMode: {
      type: String,
      enum: ["manual", "hourly", "daily", "weekly", "monthly", "yearly"],
      default: "manual",
    },
    initialValue: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  { timestamps: true },
);

export const PlanField = mongoose.model(
  "PlanField",
  PlanFieldSchema,
  "plan_fields",
);
