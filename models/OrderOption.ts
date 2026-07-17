import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderOption extends Document {
  name: string;
  processSteps: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderOptionSchema = new Schema<IOrderOption>(
  {
    name: { type: String, required: true, unique: true },
    processSteps: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const OrderOption: Model<IOrderOption> =
  mongoose.models.OrderOption ||
  mongoose.model<IOrderOption>("OrderOption", orderOptionSchema);
export default OrderOption;
