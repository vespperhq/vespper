import mongoose from "mongoose";
import { IJob } from "../types";

const Schema = mongoose.Schema;

const JobSchema = new Schema<IJob>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    type: {
      type: String,
      enum: ["ingest-knowledge"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
    },
    phase: String,
  },
  { timestamps: true },
);

export const Job = mongoose.model("Job", JobSchema);
