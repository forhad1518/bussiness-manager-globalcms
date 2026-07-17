import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICashCategory extends Document {
  name: string;
  type: "in" | "out";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const cashCategorySchema = new Schema<ICashCategory>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["in", "out"], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const CashCategory: Model<ICashCategory> =
  mongoose.models.CashCategory ||
  mongoose.model<ICashCategory>("CashCategory", cashCategorySchema);
export default CashCategory;
