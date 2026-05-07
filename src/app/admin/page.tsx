import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./login-form";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get(SESSION_COOKIE_NAME);

  if (await verifySessionToken(auth?.value)) {
    redirect("/admin/sellers");
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
