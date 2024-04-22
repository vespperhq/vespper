import mongoose from "mongoose";
import { IUser } from "../types";

const Schema = mongoose.Schema;

export const UserSchema = new Schema<IUser>(
  {
    auth0Id: String,
    email: String,
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    status: { type: String, enum: ["activated", "invited"] },
    role: { type: String, enum: ["owner", "member"] },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", UserSchema);
