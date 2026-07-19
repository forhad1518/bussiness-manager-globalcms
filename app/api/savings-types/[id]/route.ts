import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import SavingsType from "@/models/SavingsType";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  await SavingsType.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
