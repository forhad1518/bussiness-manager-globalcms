import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICashTransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: "in" | "out";
  categoryId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  createdAt: Date;
}

const cashTransactionSchema = new Schema<ICashTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["in", "out"], required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "CashCategory",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

const CashTransaction: Model<ICashTransaction> =
  mongoose.models.CashTransaction ||
  mongoose.model<ICashTransaction>("CashTransaction", cashTransactionSchema);
export default CashTransaction;
