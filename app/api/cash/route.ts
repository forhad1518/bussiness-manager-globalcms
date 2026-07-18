import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import CashTransaction from "@/models/CashTransaction";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const type = searchParams.get("type"); // "in" or "out"
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const search = searchParams.get("search") || "";
  const summary = searchParams.get("summary") === "1"; // today totals

  const filter: any = {};
  if (type && (type === "in" || type === "out")) {
    filter.type = type;
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (category) {
    filter.categoryId = category;
  }
  if (search) {
    // search in description and populate category name later? for simplicity, search description
    filter.description = { $regex: search, $options: "i" };
  }

  // If summary requested, return today's totals and overall totals for the type
  if (summary) {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const todayAgg = await CashTransaction.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: startOfToday, $lt: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const todayTotal = todayAgg.length > 0 ? todayAgg[0].total : 0;

    // Total all time for this type (ignoring date filter)
    const allTimeFilter = { ...filter };
    delete allTimeFilter.createdAt; // remove date constraint for total
    const allTimeAgg = await CashTransaction.aggregate([
      { $match: allTimeFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const allTimeTotal = allTimeAgg.length > 0 ? allTimeAgg[0].total : 0;

    return NextResponse.json({
      todayTotal,
      allTimeTotal,
    });
  }

  const skip = (page - 1) * limit;
  const totalCount = await CashTransaction.countDocuments(filter);
  const transactions = await CashTransaction.find(filter)
    .populate("categoryId", "name")
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return NextResponse.json({
    transactions,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, categoryId, amount, description } = await req.json();
  if (!type || !categoryId || amount === undefined || amount <= 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const transaction = await CashTransaction.create({
    user: user.userId,
    type,
    categoryId,
    amount,
    description: description || "",
  });
  return NextResponse.json(transaction, { status: 201 });
}
