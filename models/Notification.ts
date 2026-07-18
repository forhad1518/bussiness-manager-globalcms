import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // কোন ইউজার দেখবে (অ্যাডমিন)
  type:
    | "order_delivery_reminder"
    | "order_overdue"
    | "client_due_reminder"
    | "client_due_overdue";
  title: string;
  message: string;
  relatedOrder?: mongoose.Types.ObjectId;
  relatedClient?: mongoose.Types.ObjectId;
  scheduledAt: Date;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "order_delivery_reminder",
        "order_overdue",
        "client_due_reminder",
        "client_due_overdue",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedOrder: { type: Schema.Types.ObjectId, ref: "Order" },
    relatedClient: { type: Schema.Types.ObjectId, ref: "Client" },
    scheduledAt: { type: Date, required: true }, // যে তারিখ থেকে দেখাবে
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;
