import { getAllDeals } from "@/lib/actions/deals";
import { DealStatusBadge } from "@/components/admin/status-badge";
import { requireAdminSession } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

function formatCurrency(value: number | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AdminDealsPage() {
  await requireAdminSession();
  const deals = await getAllDeals();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
        <span className="text-sm text-muted-foreground">
          {deals.length} total
        </span>
      </div>

      {deals.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No deals yet.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Code Name</th>
                  <th className="px-4 py-3 text-left font-medium">Country</th>
                  <th className="px-4 py-3 text-left font-medium">Sector</th>
                  <th className="px-4 py-3 text-left font-medium">MRR</th>
                  <th className="px-4 py-3 text-left font-medium">Asking</th>
                  <th className="px-4 py-3 text-left font-medium">Public</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.company_code_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {d.title}
                      </div>
                    </td>
                    <td className="px-4 py-3">{d.country}</td>
                    <td className="px-4 py-3">{d.sector}</td>
                    <td className="px-4 py-3">{formatCurrency(d.monthly_revenue)}</td>
                    <td className="px-4 py-3">{formatCurrency(d.asking_price)}</td>
                    <td className="px-4 py-3">
                      {d.is_public ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <DealStatusBadge status={(d.status ?? "draft") as "draft" | "live" | "archived"} />
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
