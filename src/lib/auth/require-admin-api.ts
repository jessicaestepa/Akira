import { cookies } from "next/headers";
import { readAdminSessionCookieValue } from "@/lib/auth/admin-session-cookie";
import { verifySessionToken } from "@/lib/auth/session";

export async function requireAdminApi(): Promise<boolean> {
  const cookieStore = await cookies();
  const auth = readAdminSessionCookieValue(cookieStore);
  return verifySessionToken(auth);
}
