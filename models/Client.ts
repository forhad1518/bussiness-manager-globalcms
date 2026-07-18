import mongoose, { Document, Model, Schema } from "mongoose";

export interface IClient extends Document {
  name: string;
  fatherName: string;
  mobile: string;
  secondaryMobile?: string;
  address: string;
  dueAmount: number;
  status: "active" | "terminated";
  nextDueDate?: Date; // ডিউ নোটিফিকেশনের জন্য
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true },
    fatherName: { type: String, default: "" },
    mobile: { type: String, required: true },
    secondaryMobile: { type: String, default: "" },
    address: { type: String, default: "" },
    dueAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "terminated"], default: "active" },
    nextDueDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", clientSchema);
export default Client;
