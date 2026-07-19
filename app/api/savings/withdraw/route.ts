import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import SavingsType from "@/models/SavingsType";
import SavingsTransaction from "@/models/SavingsTransaction";
import CashTransaction from "@/models/CashTransaction";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { savingsTypeId, amount, description, categoryId } = await req.json();

  if (!savingsTypeId || !amount || amount <= 0 || !categoryId) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 },
    );
  }

  const savingsType = await SavingsType.findById(savingsTypeId);
  if (!savingsType)
    return NextResponse.json(
      { error: "Savings type not found" },
      { status: 404 },
    );

  if (savingsType.balance < amount) {
    return NextResponse.json(
      { error: "Insufficient savings balance" },
      { status: 400 },
    );
  }

  // সঞ্চয় ব্যালেন্স কমানো
  savingsType.balance -= amount;
  await savingsType.save();

  // সঞ্চয় ট্রানজ্যাকশন লগ
  await SavingsTransaction.create({
    savingsTypeId,
    type: "withdraw",
    amount,
    description: description || "Withdrawn for cash out",
    user: user.userId,
  });

  // ক্যাশ আউট ট্রানজ্যাকশন
  await CashTransaction.create({
    user: user.userId,
    type: "out",
    categoryId,
    amount,
    description: `From savings (${savingsType.name}): ${description || ""}`,
  });

  return NextResponse.json({ success: true });
}
