import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can reset password" },
      { status: 403 },
    );

  const { id } = await params;
  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const user = await User.findById(id);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  user.password = newPassword;
  await user.save();

  return NextResponse.json({ success: true });
}
