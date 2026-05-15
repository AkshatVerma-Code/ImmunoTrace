import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export type SessionUser = { id: number; email: string };

export function signSession(user: SessionUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export function verifySession(token: string): SessionUser | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUserFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get("immunotrace_token")?.value;
  if (!token) return null;
  return verifySession(token);
}
