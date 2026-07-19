import mongoose, { Document, Model, Schema } from "mongoose";

export interface IClientTransaction extends Document {
  clientId: mongoose.Types.ObjectId;
  type: "due_added" | "payment" | "terminated";
  amount: number;
  referenceOrder?: mongoose.Types.ObjectId;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const clientTransactionSchema = new Schema<IClientTransaction>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    type: {
      type: String,
      enum: ["due_added", "payment", "terminated", "reactivated"],
      required: true,
    },
    amount: { type: Number, default: 0 },
    referenceOrder: { type: Schema.Types.ObjectId, ref: "Order" },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const ClientTransaction: Model<IClientTransaction> =
  mongoose.models.ClientTransaction ||
  mongoose.model<IClientTransaction>(
    "ClientTransaction",
    clientTransactionSchema,
  );
export default ClientTransaction;
