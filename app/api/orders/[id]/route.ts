import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await Order.findById(id)
    .populate("clientId", "name mobile fatherName address")
    .populate("orderOptionId", "name processSteps")
    .populate("createdBy", "name")
    .populate("increases.addedBy", "name")
    .populate("repayments.addedBy", "name");
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status === "successful" || order.status === "cancel") {
    return NextResponse.json(
      { error: "Finished orders cannot be edited" },
      { status: 400 },
    );
  }

  const {
    clientId,
    orderOptionId,
    amount,
    payAmount,
    deliveryDate,
    currentStep,
  } = await req.json();
  if (clientId) order.clientId = clientId;
  if (orderOptionId) order.orderOptionId = orderOptionId;
  if (amount !== undefined) order.amount = amount;
  if (payAmount !== undefined) order.payAmount = payAmount;
  if (deliveryDate !== undefined)
    order.deliveryDate = deliveryDate ? new Date(deliveryDate) : undefined;
  if (currentStep !== undefined) order.currentStep = currentStep;

  await order.save();
  return NextResponse.json(order);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can delete orders" },
      { status: 403 },
    );

  const { id } = await params;
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status === "successful") {
    return NextResponse.json(
      { error: "Cannot delete successful order" },
      { status: 400 },
    );
  }
  await Order.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
