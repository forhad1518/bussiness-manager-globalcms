import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import SavingsType from "@/models/SavingsType";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const types = await SavingsType.find().sort({ createdAt: -1 });
  return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Only admin" }, { status: 403 });
  const { name } = await req.json();
  if (!name)
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  const exists = await SavingsType.findOne({ name });
  if (exists)
    return NextResponse.json({ error: "Already exists" }, { status: 400 });
  const st = await SavingsType.create({ name, createdBy: user.userId });
  return NextResponse.json(st, { status: 201 });
}
