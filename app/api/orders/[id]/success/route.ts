import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";
import Client from "@/models/Client";
import ClientTransaction from "@/models/ClientTransaction";
import { getAuthUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { expense, paid, lastAmount } = await req.json();
  if (expense === undefined) return NextResponse.json({ error: "Expense required" }, { status: 400 });

  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status === "successful") return NextResponse.json({ error: "Already successful" }, { status: 400 });

  // Mark successful
  order.status = "successful";
  order.statusHistory.push({
    status: "successful",
    cause: "",
    changedAt: new Date(),
    changedBy: new mongoose.Types.ObjectId(user.userId),
  });

  order.successData = {
    paid: !!paid,
    lastAmount: !!lastAmount,
    expense,
    settledAt: new Date(),
  };

  // Calculate total due
  const totalIncreases = order.increases.reduce((sum, inc) => sum + inc.amount, 0);
  const totalRepayments = order.repayments.reduce((sum, rep) => sum + rep.amount, 0);
  const totalOrderValue = order.amount + totalIncreases;
  const totalPaid = order.payAmount + totalRepayments;
  const due = totalOrderValue - totalPaid;

  if (lastAmount && due > 0) {
    // Add due amount to client's dueAmount
    await Client.findByIdAndUpdate(order.clientId, { $inc: { dueAmount: due } });
    await ClientTransaction.create({
      clientId: order.clientId,
      type: "due_added",
      amount: due,
      referenceOrder: order._id,
      description: `Due from order ${order.uniqueId}`,
      createdBy: new mongoose.Types.ObjectId(user.userId),
    });
  }

  await order.save();
  return NextResponse.json({ success: true });
}