"use server";

import { auth } from "@/auth"; // your NextAuth handler
import { getToken } from "next-auth/jwt";

export async function getJwtToken(req?: Request) {
  // Get session first (optional)
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  // Get the signed JWT
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  return token;
}
