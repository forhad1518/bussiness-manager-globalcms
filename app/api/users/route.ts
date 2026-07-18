import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await dbConnect();
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can view users" },
      { status: 403 },
    );

  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin")
    return NextResponse.json(
      { error: "Only admin can create users" },
      { status: 403 },
    );

  const { name, email, password, mobile, fatherName, address } =
    await req.json();
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password required" },
      { status: 400 },
    );
  }

  const existing = await User.findOne({ email });
  if (existing)
    return NextResponse.json(
      { error: "Email already exists" },
      { status: 400 },
    );

  const user = await User.create({
    name,
    email,
    password, // plain, pre-save hook hashes it
    role: "user",
    mobile: mobile || "",
    fatherName: fatherName || "",
    address: address || "",
  });

  const { password: _, ...userWithoutPassword } = user.toObject();
  return NextResponse.json(userWithoutPassword, { status: 201 });
}
