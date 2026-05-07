import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAdminSessionCookieValue } from "@/lib/auth/admin-session-cookie";
import { verifySessionToken } from "@/lib/auth/session";

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const auth = readAdminSessionCookieValue(cookieStore);
  const isAuthed = await verifySessionToken(auth);
  if (!isAuthed) redirect("/admin");
}
