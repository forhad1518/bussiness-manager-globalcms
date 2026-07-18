import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Client from "@/models/Client";
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
  const status = searchParams.get("status") || ""; // active/terminated
  const summary = searchParams.get("summary") === "1"; // শুধু কার্ডের জন্য

  const filter: any = {};
  if (status && (status === "active" || status === "terminated")) {
    filter.status = status;
  }
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ name: regex }, { mobile: regex }, { fatherName: regex }];
  }

  if (summary) {
    // কার্ড সামারি
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
    .limit(limit);

  return NextResponse.json({
    clients,
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
