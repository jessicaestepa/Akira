import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./login-form";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("aqüira_admin_auth");

  if (auth?.value === "authenticated") {
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
