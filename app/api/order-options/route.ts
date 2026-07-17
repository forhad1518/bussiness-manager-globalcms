import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import OrderOption from "@/models/OrderOption";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const options = await OrderOption.find().sort({ createdAt: -1 });
  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can create" },
      { status: 403 },
    );

  const { name } = await req.json();
  if (!name)
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const option = await OrderOption.create({
    name,
    processSteps: [],
    createdBy: user.userId,
  });
  return NextResponse.json(option, { status: 201 });
}
