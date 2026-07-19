import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISavingsTransaction extends Document {
  savingsTypeId: mongoose.Types.ObjectId;
  type: "deposit" | "withdraw";
  amount: number;
  description: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savingsTransactionSchema = new Schema<ISavingsTransaction>(
  {
    savingsTypeId: {
      type: Schema.Types.ObjectId,
      ref: "SavingsType",
      required: true,
    },
    type: { type: String, enum: ["deposit", "withdraw"], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const SavingsTransaction: Model<ISavingsTransaction> =
  mongoose.models.SavingsTransaction ||
  mongoose.model<ISavingsTransaction>(
    "SavingsTransaction",
    savingsTransactionSchema,
  );
export default SavingsTransaction;
