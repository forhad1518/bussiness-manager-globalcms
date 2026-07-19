import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Client from "@/models/Client";
import ClientTransaction from "@/models/ClientTransaction";
import CashTransaction from "@/models/CashTransaction";
import CashCategory from "@/models/CashCategory";
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
  const client = await Client.findById(id);
  if (!client)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Only admin can edit" }, { status: 403 });

  const { id } = await params;
  const { name, fatherName, address } = await req.json();
  const updateData: any = {};
  if (name) updateData.name = name;
  if (fatherName !== undefined) updateData.fatherName = fatherName;
  if (address !== undefined) updateData.address = address;

  const updated = await Client.findByIdAndUpdate(id, updateData, { new: true });
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const client = await Client.findById(id);
  if (!client)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "update-mobile") {
    const { mobile, secondaryMobile } = body;
    if (mobile !== undefined) client.mobile = mobile;
    if (secondaryMobile !== undefined) client.secondaryMobile = secondaryMobile;
    await client.save();
    return NextResponse.json(client);
  }

  if (action === "pay") {
    const { amount, description, nextDueDate } = body;
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    client.dueAmount = Math.max(0, client.dueAmount - payAmount);
    if (nextDueDate) client.nextDueDate = new Date(nextDueDate);
    await client.save();

    await ClientTransaction.create({
      clientId: client._id,
      type: "payment",
      amount: payAmount,
      description:
        description || `Payment of ${payAmount} TK from ${client.name}`,
      createdBy: user.userId,
    });

    // Auto Cash In
    let paymentCategory = await CashCategory.findOne({
      name: "Client Payment",
      type: "in",
    });
    if (!paymentCategory) {
      paymentCategory = await CashCategory.create({
        name: "Client Payment",
        type: "in",
        createdBy: user.userId,
      });
    }
    await CashTransaction.create({
      user: user.userId,
      type: "in",
      categoryId: paymentCategory._id,
      amount: payAmount,
      description: `Payment from ${client.name} (${client.mobile})`,
    });

    return NextResponse.json({ success: true, dueAmount: client.dueAmount });
  }

  if (action === "terminate") {
    const { reason } = body;
    if (!reason)
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    client.status = "terminated";
    await client.save();
    await ClientTransaction.create({
      clientId: client._id,
      type: "terminated",
      amount: 0,
      description: `Terminated: ${reason}`,
      createdBy: user.userId,
    });
    return NextResponse.json({ success: true });
  }

  if (action === "reactivate") {
    const { reason } = body;
    if (!reason)
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    client.status = "active";
    await client.save();
    await ClientTransaction.create({
      clientId: client._id,
      type: "payment",
      amount: 0,
      description: `Reactivated: ${reason}`,
      createdBy: user.userId,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
