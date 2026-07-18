import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  await dbConnect();
  const authUser = await getAuthUser();
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password required" },
      { status: 400 },
    );
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const user = await User.findById(authUser.userId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isMatch = await (user as any).comparePassword(currentPassword);
  if (!isMatch)
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 401 },
    );

  user.password = newPassword;
  await user.save();

  return NextResponse.json({ success: true });
}
