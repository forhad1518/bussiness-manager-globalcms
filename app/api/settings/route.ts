import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Settings from "@/models/Settings";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  await dbConnect();
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Only admin can update settings" }, { status: 403 });

  const body = await req.json();
  const settings = await Settings.findOneAndUpdate({}, body, {
    new: true,
    upsert: true,
  });
  return NextResponse.json(settings);
}