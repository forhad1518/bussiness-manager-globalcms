import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { getAuthUser } from "@/lib/auth";
import { Types } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { amount, method, description } = await req.json();
  if (!amount || amount <= 0 || !method)
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status === "successful" || order.status === "cancel") {
    return NextResponse.json({ error: "Cannot modify" }, { status: 400 });
  }

  order.repayments.push({
    amount,
    method,
    description: description || "",
    addedAt: new Date(),
    addedBy: new Types.ObjectId(user.userId),
  });
  await order.save();
  return NextResponse.json(order);
}
