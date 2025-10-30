import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req: req as Parameters<typeof getToken>[0]["req"],
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token) {
      console.error("No token found in request");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionToken = req.cookies.get(
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
    );

    if (!sessionToken) {
      console.error("No session cookie found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const jwtToken = jwt.sign(
      {
        id: token.sub || token.id,
        email: token.email,
        name: token.name,
      },
      process.env.AUTH_SECRET!,
      { expiresIn: "7d" },
    );

    return NextResponse.json({ token: jwtToken });
  } catch (err) {
    console.error("Error getting token:", err);
    return NextResponse.json(
      {
        error: "Failed to get token",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
