import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      raw: true,
    });

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }
}
