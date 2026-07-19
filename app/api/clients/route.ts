import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Client from "@/models/Client";
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
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const summary = searchParams.get("summary") === "1";

  const filter: any = {};
  if (status && (status === "active" || status === "terminated")) {
    filter.status = status;
  }
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { mobile: regex }, { fatherName: regex }];
  }

  if (summary) {
    // existing summary
    const totalClients = await Client.countDocuments();
    const nonPaidClients = await Client.countDocuments({
      dueAmount: { $gt: 0 },
      status: "active",
    });
    const paidClients = await Client.countDocuments({
      dueAmount: 0,
      status: "active",
    });
    const terminatedClients = await Client.countDocuments({
      status: "terminated",
    });
    const totalDueAgg = await Client.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } },
    ]);
    const totalDue = totalDueAgg.length > 0 ? totalDueAgg[0].total : 0;
    return NextResponse.json({
      totalClients,
      nonPaidClients,
      paidClients,
      terminatedClients,
      totalDue,
    });
  }

  const skip = (page - 1) * limit;
  const totalCount = await Client.countDocuments(filter);
  const clients = await Client.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // প্রতিটি ক্লায়েন্টের জন্য মোট কাজ (totalWork) ও প্রফিট (profit) বের করি
  const clientIds = clients.map((c) => c._id);
  const ordersAgg = await Order.aggregate([
    { $match: { clientId: { $in: clientIds }, status: { $ne: "cancel" } } },
    {
      $group: {
        _id: "$clientId",
        totalWork: {
          $sum: { $add: ["$amount", { $sum: "$increases.amount" }] },
        },
        profit: {
          $sum: {
            $cond: [
              { $eq: ["$status", "successful"] },
              {
                $subtract: [
                  { $add: ["$amount", { $sum: "$increases.amount" }] },
                  { $ifNull: ["$successData.expense", 0] },
                ],
              },
              0,
            ],
          },
        },
      },
    },
  ]);

  const orderMap: Record<string, { totalWork: number; profit: number }> = {};
  ordersAgg.forEach((item: any) => {
    orderMap[item._id.toString()] = {
      totalWork: item.totalWork || 0,
      profit: item.profit || 0,
    };
  });

  const clientsWithStats = clients.map((client) => ({
    ...client,
    totalWork: orderMap[client._id.toString()]?.totalWork ?? 0,
    profit: orderMap[client._id.toString()]?.profit ?? 0,
  }));

  return NextResponse.json({
    clients: clientsWithStats,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

// POST অপরিবর্তিত

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can create clients" },
      { status: 403 },
    );

  const { name, fatherName, mobile, secondaryMobile, address } =
    await req.json();
  if (!name || !mobile) {
    return NextResponse.json(
      { error: "Name and mobile required" },
      { status: 400 },
    );
  }

  const client = await Client.create({
    name,
    fatherName: fatherName || "",
    mobile,
    secondaryMobile: secondaryMobile || "",
    address: address || "",
    dueAmount: 0,
    status: "active",
    createdBy: user.userId,
  });
  return NextResponse.json(client, { status: 201 });
}
