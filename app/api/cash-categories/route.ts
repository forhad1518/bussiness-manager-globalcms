import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import CashCategory from "@/models/CashCategory";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type"); // 'in' or 'out'
  const filter: any = {};
  if (type && (type === "in" || type === "out")) {
    filter.type = type;
  }
  const categories = await CashCategory.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can create categories" },
      { status: 403 },
    );

  const { name, type } = await req.json();
  if (!name || !type || !["in", "out"].includes(type)) {
    return NextResponse.json(
      { error: "Name and valid type required" },
      { status: 400 },
    );
  }

  const category = await CashCategory.create({
    name,
    type,
    createdBy: user.userId,
  });
  return NextResponse.json(category, { status: 201 });
}
