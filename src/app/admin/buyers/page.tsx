import { supabaseAdmin } from "@/lib/supabase/client";
import { LeadStatusBadge } from "@/components/admin/status-badge";
import type { BuyerLead } from "@/lib/supabase/types";
import { requireAdminSession } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

async function getBuyers(): Promise<BuyerLead[]> {
  const { data, error } = await supabaseAdmin
    .from("buyer_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch buyers error:", error);
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

export default async function AdminBuyersPage() {
  await requireAdminSession();
  const buyers = await getBuyers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Buyer Submissions
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {buyers.length} total
          </span>
          <a
            href="/api/admin/export/buyers"
            className="text-sm text-primary hover:underline"
          >
            Export CSV
          </a>
        </div>
      </div>

      {buyers.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No buyer submissions yet.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Firm</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Check Size</th>
                  <th className="px-4 py-3 text-left font-medium">Geos</th>
                  <th className="px-4 py-3 text-left font-medium">Sectors</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.full_name}</div>
                      <div className="text-xs text-muted-foreground">{b.email}</div>
                    </td>
                    <td className="px-4 py-3">{b.firm_name_optional || "—"}</td>
                    <td className="px-4 py-3">{b.buyer_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrency(b.min_check_size)} – {formatCurrency(b.max_check_size)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {b.preferred_geographies.map((g) => (
                          <span
                            key={g}
                            className="inline-block bg-muted px-1.5 py-0.5 rounded text-xs"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {b.preferred_sectors.map((s) => (
                          <span
                            key={s}
                            className="inline-block bg-muted px-1.5 py-0.5 rounded text-xs"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={b.status} />
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
