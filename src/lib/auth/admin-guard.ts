import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const auth = cookieStore.get(SESSION_COOKIE_NAME);
  const isAuthed = await verifySessionToken(auth?.value);
  if (!isAuthed) redirect("/admin");
}
