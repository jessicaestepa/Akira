"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DealScore } from "@/lib/deal-scoring";
import type { SellerLead, DealActivityLog } from "@/lib/supabase/types";
import { ScoreBreakdown } from "./score-breakdown";
import { LpDealCard } from "./lp-deal-card";
import { buildLpDealCardData } from "@/lib/lp-card-generator";

interface Props {
  seller: SellerLead | null;
  activities: DealActivityLog[];
  onClose: () => void;
  onSaveNotes: (sellerId: string, notes: string) => Promise<void>;
  onGenerateCard: (sellerId: string) => Promise<void>;
}

export function DealDetailPanel({
  seller,
  activities,
  onClose,
  onSaveNotes,
  onGenerateCard,
}: Props) {
  const [notes, setNotes] = useState(seller?.thesis_fit_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const score = useMemo<DealScore>(
    () => ({
      total: seller?.deal_score ?? 0,
      breakdown:
        seller?.score_breakdown ?? {
          businessType: 0,
          recurringRevenue: 0,
          marginProfile: 0,
          valuationMultiple: 0,
          aiOpportunity: 0,
          marketSize: 0,
        },
      flags: [],
      redFlags: [],
    }),
    [seller]
  );

  if (!seller) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l bg-background p-5 overflow-y-auto shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{seller.company_name}</h2>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {seller.business_type} • {seller.country} • score {seller.deal_score}/100
        </div>
        <ScoreBreakdown breakdown={score.breakdown} />

        <div className="space-y-2">
          <p className="text-sm font-medium">Thesis Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Private notes for LP conversations..."
          />
          <Button
            type="button"
            onClick={async () => {
              setSaving(true);
              await onSaveNotes(seller.id, notes);
              setSaving(false);
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save notes"}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await onGenerateCard(seller.id);
                setShowCard(true);
              }}
            >
              Generate LP Card
            </Button>
            {seller.lp_card_generated && <Badge variant="secondary">Generated</Badge>}
          </div>
          {showCard && <LpDealCard data={buildLpDealCardData(seller, score)} />}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Activity</p>
          <div className="space-y-2">
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {activities.map((log) => (
              <div key={log.id} className="rounded border border-border p-2 text-xs">
                <div className="font-medium">{log.action}</div>
                <div className="text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
