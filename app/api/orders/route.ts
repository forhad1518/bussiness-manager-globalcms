import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const status = searchParams.get("status") || "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search") || "";
  const summary = searchParams.get("summary") === "1";

  const filter: any = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (search) {
    const regex = new RegExp(search, "i");
    // We'll populate client and search name/mobile later, but for now search uniqueId
    filter.$or = [{ uniqueId: regex }];
  }

  if (summary) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalOrders,
      pendingOrders,
      thisMonthOrders,
      thisMonthSuccess,
      thisMonthCancel,
      thisMonthAmountAgg,
      thisMonthProfitAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Order.countDocuments({
        status: "successful",
        "successData.settledAt": { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Order.countDocuments({
        status: "cancel",
        updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: "successful",
          },
        },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "successful",
            "successData.settledAt": { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            profit: {
              $sum: {
                $subtract: [
                  { $add: ["$amount", { $sum: "$increases.amount" }] },
                  { $ifNull: ["$successData.expense", 0] },
                ],
              },
            },
          },
        },
      ]),
    ]);

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      thisMonthOrders,
      thisMonthSuccess,
      thisMonthCancel,
      thisMonthAmount: thisMonthAmountAgg.length
        ? thisMonthAmountAgg[0].totalAmount
        : 0,
      thisMonthProfit: thisMonthProfitAgg.length
        ? thisMonthProfitAgg[0].profit
        : 0,
    });
  }

  const skip = (page - 1) * limit;
  const totalCount = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate("clientId", "name mobile")
    .populate("orderOptionId", "name")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return NextResponse.json({
    orders,
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

  const { clientId, orderOptionId, amount, payAmount, deliveryDate } =
    await req.json();
  if (!clientId || !orderOptionId || amount === undefined || amount <= 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const order = await Order.create({
    clientId,
    orderOptionId,
    amount,
    payAmount: payAmount || 0,
    deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    status: "submit",
    createdBy: user.userId,
    statusHistory: [
      {
        status: "submit",
        cause: "",
        changedAt: new Date(),
        changedBy: user.userId,
      },
    ],
  });
  return NextResponse.json(order, { status: 201 });
}
