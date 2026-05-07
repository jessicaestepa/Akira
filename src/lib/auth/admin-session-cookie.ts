/**
 * Cookie names for admin session (middleware + API + server components must match).
 * Legacy name kept so existing browsers keep working until they re-login.
 */
export const ADMIN_SESSION_COOKIE_NAMES = [
  "aquira_admin_auth",
  "aqüira_admin_auth",
] as const;

export function readAdminSessionCookieValue(
  cookies: { get: (name: string) => { value: string } | undefined }
): string | undefined {
  for (const name of ADMIN_SESSION_COOKIE_NAMES) {
    const v = cookies.get(name)?.value;
    if (v) return v;
  }
  return undefined;
}
