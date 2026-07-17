import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISettings extends Document {
  storeName: string;
  storeAddress: string;
  proprietorName: string;
  mobile: string;
  watermark: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "" },
    storeAddress: { type: String, default: "" },
    proprietorName: { type: String, default: "" },
    mobile: { type: String, default: "" },
    watermark: { type: String, default: "" },
  },
  { timestamps: true },
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", settingsSchema);
export default Settings;
