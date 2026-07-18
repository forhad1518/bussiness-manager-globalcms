import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import CashTransaction from "@/models/CashTransaction";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { type, categoryId, amount, description } = await req.json();
  const updateData: any = {};
  if (type) updateData.type = type;
  if (categoryId) updateData.categoryId = categoryId;
  if (amount !== undefined) updateData.amount = amount;
  if (description !== undefined) updateData.description = description;

  const updated = await CashTransaction.findByIdAndUpdate(id, updateData, {
    new: true,
  })
    .populate("categoryId", "name")
    .populate("user", "name");
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await CashTransaction.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
