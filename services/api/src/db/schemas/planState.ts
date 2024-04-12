import mongoose from "mongoose";
import { IPlanState } from "../../types";

const Schema = mongoose.Schema;

export const PlanStateSchema = new Schema<IPlanState>(
  {
    plan: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    state: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true, minimize: false },
);

export const PlanState = mongoose.model(
  "PlanState",
  PlanStateSchema,
  "plan_states",
);
