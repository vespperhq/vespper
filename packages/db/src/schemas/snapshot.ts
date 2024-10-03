import mongoose from "mongoose";
import { ISnapshot } from "../types";

const Schema = mongoose.Schema;

export const SnapshotSchema = new Schema<ISnapshot>(
  {
    stats: Schema.Types.Mixed,
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  { timestamps: true },
);

export const Snapshot = mongoose.model("Snapshot", SnapshotSchema);
