import mongoose from "mongoose";
import User from "@/models/User";

const MONGODB_URI = process.env.MONGODB_URI!;

let isConnected = false;

export async function dbConnect() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "business-manager-globalcms",
    });
    isConnected = true;
    console.log("MongoDB connected");
    await seedAdmin();
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) return;

  const existing = await User.findOne({ role: "admin" });
  if (existing) return;

  await User.create({
    name: "Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
  });
  console.log("Default admin created");
}
