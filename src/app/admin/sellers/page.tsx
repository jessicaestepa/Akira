import { supabaseAdmin } from "@/lib/supabase/client";
import { LeadStatusBadge } from "@/components/admin/status-badge";
import type { SellerLead } from "@/lib/supabase/types";
import { requireAdminSession } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

async function getSellers(): Promise<SellerLead[]> {
  const { data, error } = await supabaseAdmin
    .from("seller_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch sellers error:", error);
    return [];
  }
  return data ?? [];
}

function formatCurrency(value: number | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AdminSellersPage() {
  await requireAdminSession();
  const sellers = await getSellers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Seller Submissions
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {sellers.length} total
          </span>
          <a
            href="/api/admin/export/sellers"
            className="text-sm text-primary hover:underline"
          >
            Export CSV
          </a>
        </div>
      </div>

      {sellers.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No seller submissions yet.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Country</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">MRR</th>
                  <th className="px-4 py-3 text-left font-medium">Asking</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.full_name}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-4 py-3">{s.company_name}</td>
                    <td className="px-4 py-3">{s.country}</td>
                    <td className="px-4 py-3">{s.business_type}</td>
                    <td className="px-4 py-3">{formatCurrency(s.monthly_revenue)}</td>
                    <td className="px-4 py-3">{formatCurrency(s.asking_price)}</td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
