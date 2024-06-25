import mongoose from "mongoose";
import { IBetaCode } from "../types";

const Schema = mongoose.Schema;

export const BetaCodeSchema = new Schema<IBetaCode>(
  {
    code: String,
    status: { type: String, enum: ["new", "used"] },
  },
  { timestamps: true },
);

export const BetaCode = mongoose.model("BetaCode", BetaCodeSchema);
