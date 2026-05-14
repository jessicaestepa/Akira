import { requireAdminSession } from "@/lib/auth/admin-guard";
import { supabaseAdmin } from "@/lib/supabase/client";
import type {
  DealDiligenceChecklistItem,
  DealDiligenceQuestion,
  DealDiligenceReview,
  DealDiligenceRisk,
  SellerLead,
} from "@/lib/supabase/types";
import { DiligenceWorkspace } from "@/components/admin/diligence-workspace";

export const dynamic = "force-dynamic";

export default async function DiligencePage({
  searchParams,
}: {
  searchParams: Promise<{ seller?: string }>;
}) {
  await requireAdminSession();

  const [{ data: sellers }, { data: reviews }, { data: checklist }, { data: questions }, { data: risks }] =
    await Promise.all([
      supabaseAdmin.from("seller_leads").select("*").order("deal_score", { ascending: false }),
      supabaseAdmin.from("deal_diligence_reviews").select("*").order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("deal_diligence_checklist_items")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("deal_diligence_questions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("deal_diligence_risks")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const { seller } = await searchParams;

  return (
    <DiligenceWorkspace
      sellers={(sellers ?? []) as SellerLead[]}
      reviews={(reviews ?? []) as DealDiligenceReview[]}
      checklist={(checklist ?? []) as DealDiligenceChecklistItem[]}
      questions={(questions ?? []) as DealDiligenceQuestion[]}
      risks={(risks ?? []) as DealDiligenceRisk[]}
      initialSellerId={seller ?? null}
    />
  );
}
