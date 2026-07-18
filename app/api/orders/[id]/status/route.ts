import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { Types } from "mongoose";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, cause } = await req.json();
  const validStatuses = [
    "submit",
    "process",
    "pending",
    "successful",
    "cancel",
  ];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status === "successful" || order.status === "cancel") {
    return NextResponse.json(
      { error: "Cannot change status of finished order" },
      { status: 400 },
    );
  }

  // Allow any status change, but require cause for pending/cancel
  if ((status === "pending" || status === "cancel") && !cause) {
    return NextResponse.json(
      { error: "Cause required for pending/cancel" },
      { status: 400 },
    );
  }

  order.statusHistory.push({
    status,
    cause: cause || "",
    changedAt: new Date(),
    changedBy: new Types.ObjectId(user.userId),
  });
  order.status = status;
  await order.save();
  return NextResponse.json({ success: true, status: order.status });
}
