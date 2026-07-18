import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Client from "@/models/Client";
import ClientTransaction from "@/models/ClientTransaction";
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

// Mobile update (primary or secondary) — specific PATCH
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json(); // 'update-mobile', 'pay', 'terminate'

  const client = await Client.findById(id);
  if (!client)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "update-mobile") {
    const { mobile, secondaryMobile } = await req.json();
    if (mobile !== undefined) client.mobile = mobile;
    if (secondaryMobile !== undefined) client.secondaryMobile = secondaryMobile;
    await client.save();
    return NextResponse.json(client);
  }

  if (action === "pay") {
    const { amount, description } = await req.json();
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    // ক্লায়েন্টের dueAmount কমানো
    client.dueAmount = Math.max(0, client.dueAmount - payAmount);
    await client.save();

    // ট্রানজ্যাকশন তৈরি
    await ClientTransaction.create({
      clientId: client._id,
      type: "payment",
      amount: payAmount,
      description: description || `Payment of ${payAmount} TK`,
      createdBy: user.userId,
    });

    return NextResponse.json({ success: true, dueAmount: client.dueAmount });
  }

  if (action === "terminate") {
    client.status = "terminated";
    await client.save();
    // ট্রানজ্যাকশন (ঐচ্ছিক)
    await ClientTransaction.create({
      clientId: client._id,
      type: "terminated",
      amount: 0,
      description: "Client terminated",
      createdBy: user.userId,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can delete" },
      { status: 403 },
    );

  const { id } = await params;
  await Client.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
