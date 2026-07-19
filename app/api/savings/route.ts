import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import SavingsTransaction from "@/models/SavingsTransaction";
import SavingsType from "@/models/SavingsType";
import CashTransaction from "@/models/CashTransaction";
import CashCategory from "@/models/CashCategory";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // আগের GET কোড অপরিবর্তিত থাকবে
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { savingsTypeId, type, amount, description } = await req.json();

  // এখন শুধু deposit allow করছি
  if (!savingsTypeId || type !== "deposit" || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const savingsType = await SavingsType.findById(savingsTypeId);
  if (!savingsType)
    return NextResponse.json(
      { error: "Savings type not found" },
      { status: 404 },
    );

  // বর্তমান লাস্ট ক্যাশ বের করি (মোট ইন - মোট আউট)
  const [totalInAgg, totalOutAgg] = await Promise.all([
    CashTransaction.aggregate([
      { $match: { type: "in" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CashTransaction.aggregate([
      { $match: { type: "out" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  const totalIn = totalInAgg[0]?.total || 0;
  const totalOut = totalOutAgg[0]?.total || 0;
  const lastCash = totalIn - totalOut;

  if (amount > lastCash) {
    return NextResponse.json(
      { error: `Insufficient Last Cash. Available: ৳${lastCash}` },
      { status: 400 },
    );
  }

  // সিস্টেম ক্যাটাগরি "Transfer to Savings" বের বা তৈরি করি
  let transferCategory = await CashCategory.findOne({
    name: "Transfer to Savings",
    type: "out",
  });
  if (!transferCategory) {
    transferCategory = await CashCategory.create({
      name: "Transfer to Savings",
      type: "out",
      createdBy: user.userId,
    });
  }

  // লাস্ট ক্যাশ থেকে কাটতে Cash Out ট্রানজ্যাকশন তৈরি
  await CashTransaction.create({
    user: user.userId,
    type: "out",
    categoryId: transferCategory._id,
    amount,
    description: `Transfer to ${savingsType.name}: ${description || ""}`,
  });

  // সঞ্চয় ব্যালেন্স বাড়ানো
  savingsType.balance += amount;
  await savingsType.save();

  // সঞ্চয়ের ট্রানজ্যাকশন লগ (deposit)
  const transaction = await SavingsTransaction.create({
    savingsTypeId,
    type: "deposit",
    amount,
    description: description || "Deposit from Last Cash",
    user: user.userId,
  });

  return NextResponse.json(transaction, { status: 201 });
}
