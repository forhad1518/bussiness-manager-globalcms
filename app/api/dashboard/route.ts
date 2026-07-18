import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import CashTransaction from "@/models/CashTransaction";
import Order from "@/models/Order";
import Client from "@/models/Client";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfYesterday = new Date(
    startOfToday.getTime() - 24 * 60 * 60 * 1000,
  );
  const endOfYesterday = startOfToday;

  // Today in/out
  const todayAgg = await CashTransaction.aggregate([
    { $match: { createdAt: { $gte: startOfToday, $lt: endOfToday } } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const todayIn = todayAgg.find((t) => t._id === "in")?.total || 0;
  const todayOut = todayAgg.find((t) => t._id === "out")?.total || 0;

  // Yesterday
  const yesterdayAgg = await CashTransaction.aggregate([
    { $match: { createdAt: { $gte: startOfYesterday, $lt: endOfYesterday } } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const yesterdayIn = yesterdayAgg.find((t) => t._id === "in")?.total || 0;
  const yesterdayOut = yesterdayAgg.find((t) => t._id === "out")?.total || 0;

  // This month daily in/out
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthDaily = await CashTransaction.aggregate([
    { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        in: { $sum: { $cond: [{ $eq: ["$type", "in"] }, "$amount", 0] } },
        out: { $sum: { $cond: [{ $eq: ["$type", "out"] }, "$amount", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Current year monthly
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  const yearMonthly = await CashTransaction.aggregate([
    { $match: { createdAt: { $gte: yearStart, $lte: yearEnd } } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        in: { $sum: { $cond: [{ $eq: ["$type", "in"] }, "$amount", 0] } },
        out: { $sum: { $cond: [{ $eq: ["$type", "out"] }, "$amount", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Multi-year
  const currentYear = now.getFullYear();
  const yearlyAgg = await CashTransaction.aggregate([
    { $match: { createdAt: { $gte: new Date(currentYear - 4, 0, 1) } } },
    {
      $group: {
        _id: { $year: "$createdAt" },
        in: { $sum: { $cond: [{ $eq: ["$type", "in"] }, "$amount", 0] } },
        out: { $sum: { $cond: [{ $eq: ["$type", "out"] }, "$amount", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Cards data
  const [
    totalClients,
    totalOrders,
    pendingOrders,
    dueAgg,
    thisMonthSuccess,
    totalInAgg,
    totalOutAgg,
  ] = await Promise.all([
    Client.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ status: "pending" }),
    Client.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } },
    ]),
    Order.countDocuments({
      status: "successful",
      "successData.settledAt": { $gte: monthStart, $lte: monthEnd },
    }),
    CashTransaction.aggregate([
      { $match: { type: "in" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CashTransaction.aggregate([
      { $match: { type: "out" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const dueAmount = dueAgg.length > 0 ? dueAgg[0].total : 0;
  const lastCashAmount =
    (totalInAgg[0]?.total || 0) - (totalOutAgg[0]?.total || 0);

  // Fill missing months
  const yearMonths = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    in: 0,
    out: 0,
  }));
  yearMonthly.forEach((m) => {
    const idx = yearMonths.findIndex((x) => x.month === m._id);
    if (idx >= 0) {
      yearMonths[idx].in = m.in;
      yearMonths[idx].out = m.out;
    }
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
  const yearly = yearlyAgg.map((y) => ({ year: y._id, in: y.in, out: y.out }));
  const allYearly = years.map((y) => {
    const found = yearly.find((f) => f.year === y);
    return found || { year: y, in: 0, out: 0 };
  });

  return NextResponse.json({
    cards: {
      totalClients,
      totalOrders,
      pendingOrders,
      dueAmount,
      thisMonthSuccess,
      lastCashAmount,
    },
    today: { in: todayIn, out: todayOut },
    yesterday: { in: yesterdayIn, out: yesterdayOut },
    thisMonth: monthDaily.map((d) => ({
      date: d._id,
      in: d.in,
      out: d.out,
    })),
    year: yearMonths,
    yearly: allYearly,
  });
}
