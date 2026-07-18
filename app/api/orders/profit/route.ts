import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // সব successful অর্ডারের প্রফিট সমষ্টি
  const result = await Order.aggregate([
    { $match: { status: "successful" } },
    {
      $group: {
        _id: null,
        totalProfit: {
          $sum: {
            $subtract: [
              { $add: ["$amount", { $sum: "$increases.amount" }] },
              { $ifNull: ["$successData.expense", 0] },
            ],
          },
        },
      },
    },
  ]);

  const profit = result.length > 0 ? result[0].totalProfit : 0;
  return NextResponse.json({ profit });
}
