import Link from "next/link";
import { cookies } from "next/headers";
import { readAdminSessionCookieValue } from "@/lib/auth/admin-session-cookie";
import { verifySessionToken } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/client";
import { getPipelinePath } from "@/lib/auth/pipeline-path";

async function getNewDealCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from("seller_leads")
    .select("*", { count: "exact", head: true })
    .eq("deal_stage", "new");

  return count ?? 0;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const auth = readAdminSessionCookieValue(cookieStore);
  const isAuthed = await verifySessionToken(auth);
  if (!isAuthed) {
    return (
      <div className="min-h-screen">
        <main className="py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    );
  }

  const newDeals = await getNewDealCount();
  const pipelinePath = await getPipelinePath();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-8">
            <Link
              href="/admin"
              className="text-lg font-semibold tracking-tight inline-flex items-baseline gap-1.5"
            >
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Aqüira
              </span>
              <span className="text-muted-foreground font-normal text-sm">
                Admin
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/admin/sellers"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Sellers
              </Link>
              <Link
                href="/admin/buyers"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Buyers
              </Link>
              <Link
                href="/admin/deals"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Deals
              </Link>
              <Link
                href={pipelinePath}
                className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
              >
                Pipeline
                {newDeals > 0 && (
                  <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-primary/15 text-primary text-xs px-1.5">
                    {newDeals}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
