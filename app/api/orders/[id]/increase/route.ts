import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { amount, cause, description } = await req.json();
  if (!amount || amount <= 0)
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status === "successful" || order.status === "cancel") {
    return NextResponse.json(
      { error: "Finished orders cannot be modified" },
      { status: 400 },
    );
  }

  order.increases.push({
    amount,
    cause: cause || "",
    description: description || "",
    addedAt: new Date(),
    addedBy: user.userId,
  });
  await order.save();
  return NextResponse.json(order);
}
