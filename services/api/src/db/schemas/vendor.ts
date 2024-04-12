import mongoose from "mongoose";
import { IVendor } from "../../types";

const Schema = mongoose.Schema;

export const VendorSchema = new Schema<IVendor>(
  {
    name: String,
    description: String,
  },
  { timestamps: true },
);

export const Vendor = mongoose.model("Vendor", VendorSchema);
