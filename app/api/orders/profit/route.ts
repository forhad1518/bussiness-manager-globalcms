import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order"; // আমরা এখনও তৈরি করিনি, তবে সামনে আসবে
import { getAuthUser } from "@/lib/auth";

// অস্থায়ী সমাধান — যতক্ষণ না অর্ডার মডেল তৈরি হয়, একটি ফাঁকা প্রফিট API
export async function GET() {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // যখন Order মডেল থাকবে তখন নিচের এগ্রিগেশন করব। আপাতত 0 পাঠাই।
  return NextResponse.json({ profit: 0 });
}
