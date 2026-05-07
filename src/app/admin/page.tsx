import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./login-form";
import { readAdminSessionCookieValue } from "@/lib/auth/admin-session-cookie";
import { verifySessionToken } from "@/lib/auth/session";
import { getPipelinePath } from "@/lib/auth/pipeline-path";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const auth = readAdminSessionCookieValue(cookieStore);

  if (await verifySessionToken(auth)) {
    const pipelinePath = await getPipelinePath();
    redirect(pipelinePath);
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight mb-6 text-center">
          Admin Login
        </h1>
        <AdminLoginForm />
      </div>
    </div>
  );
}
