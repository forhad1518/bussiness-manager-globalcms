import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { signToken, setTokenCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const isMatch = await (user as any).comparePassword(password);
  if (!isMatch)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = signToken({ userId: user._id.toString(), role: user.role });
  const response = NextResponse.json({
    success: true,
    role: user.role,
    name: user.name,
  });
  response.cookies.set(setTokenCookie(token));
  return response;
}
