import mongoose from "mongoose";
import { fieldEncryption } from "mongoose-field-encryption";
import { IWebhook } from "../types";

const Schema = mongoose.Schema;
const Encryption = fieldEncryption;

const WebhookSchema = new Schema<IWebhook>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    secret: String,
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "test") {
  WebhookSchema.plugin(Encryption, {
    fields: ["secret"],
    secret: process.env["METADATA_ENCRYPTION_KEY"],
    saltGenerator: () => process.env["ENCRYPTION_SALT"],
  });
}

export const Webhook = mongoose.model("Webhook", WebhookSchema);
