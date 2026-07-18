import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can edit users" },
      { status: 403 },
    );

  const { id } = await params;
  const { name, email, mobile, fatherName, address, role } = await req.json();

  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (mobile !== undefined) updateData.mobile = mobile;
  if (fatherName !== undefined) updateData.fatherName = fatherName;
  if (address !== undefined) updateData.address = address;
  if (role && (role === "admin" || role === "user")) updateData.role = role;

  // prevent removing the last admin
  if (role === "user") {
    const adminCount = await User.countDocuments({ role: "admin" });
    const targetUser = await User.findById(id);
    if (targetUser?.role === "admin" && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last admin" },
        { status: 400 },
      );
    }
  }

  const updated = await User.findByIdAndUpdate(id, updateData, {
    new: true,
  }).select("-password");
  if (!updated)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can delete users" },
      { status: 403 },
    );

  const { id } = await params;

  const targetUser = await User.findById(id);
  if (!targetUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (targetUser.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin" },
        { status: 400 },
      );
    }
  }

  await User.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
