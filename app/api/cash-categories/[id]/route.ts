import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import CashCategory from "@/models/CashCategory";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user || user.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can delete" },
      { status: 403 },
    );

  const { id } = await params;
  await CashCategory.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
