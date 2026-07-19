import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISavingsType extends Document {
  name: string;
  balance: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savingsTypeSchema = new Schema<ISavingsType>(
  {
    name: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const SavingsType: Model<ISavingsType> =
  mongoose.models.SavingsType ||
  mongoose.model<ISavingsType>("SavingsType", savingsTypeSchema);
export default SavingsType;
