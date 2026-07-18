import mongoose, { Document, Model, Schema } from "mongoose";

export interface IStatusHistory {
  status: "submit" | "process" | "pending" | "successful" | "cancel";
  cause: string;
  changedAt: Date;
  changedBy: mongoose.Types.ObjectId;
}

export interface IIncrease {
  amount: number;
  cause: string;
  description: string;
  addedAt: Date;
  addedBy: mongoose.Types.ObjectId;
}

export interface IRepayment {
  amount: number;
  method: string;
  description: string;
  addedAt: Date;
  addedBy: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  uniqueId: string;
  clientId: mongoose.Types.ObjectId;
  orderOptionId: mongoose.Types.ObjectId;
  amount: number;
  payAmount: number;
  status: "submit" | "process" | "pending" | "successful" | "cancel";
  currentStep: string;
  deliveryDate?: Date;
  statusHistory: IStatusHistory[];
  increases: IIncrease[];
  repayments: IRepayment[];
  expense?: number;
  dueAsReceivable?: boolean;
  successData?: {
    paid: boolean;
    lastAmount: boolean;
    expense: number;
    settledAt: Date;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: ["submit", "process", "pending", "successful", "cancel"],
      required: true,
    },
    cause: { type: String, default: "" },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false },
);

const increaseSchema = new Schema<IIncrease>(
  {
    amount: { type: Number, required: true },
    cause: { type: String, default: "" },
    description: { type: String, default: "" },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: true },
);

const repaymentSchema = new Schema<IRepayment>(
  {
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    description: { type: String, default: "" },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: true },
);

const orderSchema = new Schema<IOrder>(
  {
    uniqueId: { type: String, unique: true, sparse: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    orderOptionId: {
      type: Schema.Types.ObjectId,
      ref: "OrderOption",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    payAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["submit", "process", "pending", "successful", "cancel"],
      default: "submit",
    },
    currentStep: { type: String, default: "" },
    deliveryDate: { type: Date },
    statusHistory: [statusHistorySchema],
    increases: [increaseSchema],
    repayments: [repaymentSchema],
    expense: { type: Number, default: 0 },
    dueAsReceivable: { type: Boolean, default: false },
    successData: {
      paid: { type: Boolean, default: false },
      lastAmount: { type: Boolean, default: false },
      expense: { type: Number, default: 0 },
      settledAt: { type: Date },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// ঠিক করা হুক — async ফাংশনে next লাগে না
orderSchema.pre("save", async function () {
  if (this.isNew && !this.uniqueId) {
    const lastOrder = await (this.constructor as Model<IOrder>)
      .findOne({})
      .sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastOrder && lastOrder.uniqueId) {
      const lastNum = parseInt(lastOrder.uniqueId.replace("ORD-", ""), 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    this.uniqueId = `ORD-${String(nextNumber).padStart(4, "0")}`;
  }
});

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
export default Order;
