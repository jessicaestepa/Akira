"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  DealDiligenceChecklistItem,
  DealDiligenceQuestion,
  DealDiligenceReview,
  DealDiligenceRisk,
  SellerLead,
} from "@/lib/supabase/types";
import { estimateAskingPrice, estimateMonthlyRevenue } from "@/lib/seller-financials";

interface DiligencePayload {
  review: DealDiligenceReview;
  checklist: DealDiligenceChecklistItem[];
  questions: DealDiligenceQuestion[];
  risks: DealDiligenceRisk[];
}

interface Props {
  sellers: SellerLead[];
  reviews: DealDiligenceReview[];
  checklist: DealDiligenceChecklistItem[];
  questions: DealDiligenceQuestion[];
  risks: DealDiligenceRisk[];
  initialSellerId: string | null;
}

function money(value: number | null): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function reviewProgress(items: DealDiligenceChecklistItem[]): string {
  if (items.length === 0) return "0/0";
  const done = items.filter((i) => i.status === "cleared").length;
  return `${done}/${items.length}`;
}

function badgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "cleared" || status === "complete" || status === "continue" || status === "lp_ready") {
    return "secondary";
  }
  if (status === "blocked" || status === "pass" || status === "high") return "destructive";
  if (status === "in_progress" || status === "needs_followup") return "default";
  return "outline";
}

export function DiligenceWorkspace({
  sellers,
  reviews,
  checklist,
  questions,
  risks,
  initialSellerId,
}: Props) {
  const [reviewRows, setReviewRows] = useState(reviews);
  const [checklistRows, setChecklistRows] = useState(checklist);
  const [questionRows, setQuestionRows] = useState(questions);
  const [riskRows, setRiskRows] = useState(risks);
  const [selectedSellerId, setSelectedSellerId] = useState(
    initialSellerId ?? reviews[0]?.seller_id ?? sellers[0]?.id ?? null
  );
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newRisk, setNewRisk] = useState("");

  const selectedSeller = sellers.find((s) => s.id === selectedSellerId) ?? null;
  const review = reviewRows.find((r) => r.seller_id === selectedSellerId) ?? null;
  const currentChecklist = checklistRows.filter((item) => item.review_id === review?.id);
  const currentQuestions = questionRows.filter((q) => q.review_id === review?.id);
  const currentRisks = riskRows.filter((r) => r.review_id === review?.id);

  const sellersWithDdFirst = useMemo(() => {
    const hasReview = new Set(reviewRows.map((r) => r.seller_id));
    return [...sellers].sort((a, b) => {
      const aHas = hasReview.has(a.id) ? 1 : 0;
      const bHas = hasReview.has(b.id) ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return (b.deal_score ?? 0) - (a.deal_score ?? 0);
    });
  }, [reviewRows, sellers]);

  function mergePayload(payload: DiligencePayload) {
    setReviewRows((rows) => {
      const others = rows.filter((r) => r.id !== payload.review.id);
      return [payload.review, ...others];
    });
    setChecklistRows((rows) => [
      ...rows.filter((item) => item.review_id !== payload.review.id),
      ...payload.checklist,
    ]);
    setQuestionRows((rows) => [
      ...rows.filter((item) => item.review_id !== payload.review.id),
      ...payload.questions,
    ]);
    setRiskRows((rows) => [
      ...rows.filter((item) => item.review_id !== payload.review.id),
      ...payload.risks,
    ]);
  }

  async function callDiligence(sellerId: string, body?: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/diligence/${sellerId}`, {
        method: body ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error("Failed to update diligence");
      const payload = (await res.json()) as DiligencePayload;
      mergePayload(payload);
      setSelectedSellerId(sellerId);
    } finally {
      setSaving(false);
    }
  }

  function updateLocalReview(patch: Partial<DealDiligenceReview>) {
    if (!review) return;
    setReviewRows((rows) => rows.map((r) => (r.id === review.id ? { ...r, ...patch } : r)));
  }

  function updateLocalChecklist(id: string, patch: Partial<DealDiligenceChecklistItem>) {
    setChecklistRows((rows) => rows.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function updateLocalQuestion(id: string, patch: Partial<DealDiligenceQuestion>) {
    setQuestionRows((rows) => rows.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function updateLocalRisk(id: string, patch: Partial<DealDiligenceRisk>) {
    setRiskRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Deal Intelligence</p>
        <h1 className="text-2xl font-semibold tracking-tight">Due Diligence Workspace</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Turn prioritized deals into structured diligence dossiers: checklist, seller questions,
          risk register, and IC recommendation.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-lg border bg-background">
          <div className="border-b px-4 py-3">
            <p className="font-medium">Companies</p>
            <p className="text-xs text-muted-foreground">
              {reviewRows.length} active DD dossiers
            </p>
          </div>
          <div className="max-h-[72vh] overflow-y-auto">
            {sellersWithDdFirst.map((seller) => {
              const r = reviewRows.find((x) => x.seller_id === seller.id);
              const items = r ? checklistRows.filter((item) => item.review_id === r.id) : [];
              return (
                <button
                  key={seller.id}
                  type="button"
                  onClick={() => setSelectedSellerId(seller.id)}
                  className={`block w-full border-b px-4 py-3 text-left hover:bg-muted/40 ${
                    selectedSellerId === seller.id ? "bg-muted/60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{seller.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {seller.business_type} · score {seller.deal_score}/100
                      </p>
                    </div>
                    <Badge variant={r ? badgeVariant(r.status) : "outline"} className="shrink-0">
                      {r ? reviewProgress(items) : "not started"}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-lg border bg-background p-5">
          {!selectedSeller && (
            <p className="text-sm text-muted-foreground">No companies in pipeline yet.</p>
          )}

          {selectedSeller && !review && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Selected company</p>
                <h2 className="text-xl font-semibold">{selectedSeller.company_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedSeller.business_type} · {selectedSeller.country} · score{" "}
                  {selectedSeller.deal_score}/100
                </p>
              </div>
              <Button
                type="button"
                disabled={saving}
                onClick={() => callDiligence(selectedSeller.id)}
              >
                {saving ? "Starting..." : "Start Due Diligence"}
              </Button>
            </div>
          )}

          {selectedSeller && review && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{selectedSeller.company_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedSeller.business_type} · {selectedSeller.country} · revenue{" "}
                    {money(estimateMonthlyRevenue(selectedSeller))}/mo · asking{" "}
                    {money(estimateAskingPrice(selectedSeller))}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={badgeVariant(review.status)}>{statusLabel(review.status)}</Badge>
                  <Badge variant={badgeVariant(review.recommendation)}>
                    {statusLabel(review.recommendation)}
                  </Badge>
                  <Badge variant="outline">Checklist {reviewProgress(currentChecklist)}</Badge>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">DD status</span>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3"
                    value={review.status}
                    onChange={(e) => updateLocalReview({ status: e.target.value as DealDiligenceReview["status"] })}
                  >
                    <option value="in_progress">in progress</option>
                    <option value="blocked">blocked</option>
                    <option value="complete">complete</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">IC recommendation</span>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3"
                    value={review.recommendation}
                    onChange={(e) =>
                      updateLocalReview({
                        recommendation: e.target.value as DealDiligenceReview["recommendation"],
                      })
                    }
                  >
                    <option value="undecided">undecided</option>
                    <option value="continue">continue</option>
                    <option value="pass">pass</option>
                    <option value="lp_ready">LP-ready</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="font-medium">Executive summary</span>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={review.executive_summary ?? ""}
                    onChange={(e) => updateLocalReview({ executive_summary: e.target.value })}
                    placeholder="What matters most for IC?"
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="font-medium">Primary risk</span>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={review.primary_risk ?? ""}
                    onChange={(e) => updateLocalReview({ primary_risk: e.target.value })}
                    placeholder="The one issue that could kill this deal."
                  />
                </label>
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      callDiligence(selectedSeller.id, {
                        action: "review_update",
                        status: review.status,
                        recommendation: review.recommendation,
                        executive_summary: review.executive_summary ?? "",
                        primary_risk: review.primary_risk ?? "",
                      })
                    }
                  >
                    {saving ? "Saving..." : "Save review"}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">DD checklist</h3>
                <div className="space-y-2">
                  {currentChecklist.map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={item.status}
                          onChange={(e) => {
                            const status = e.target.value as DealDiligenceChecklistItem["status"];
                            updateLocalChecklist(item.id, { status });
                            callDiligence(selectedSeller.id, {
                              action: "checklist_update",
                              item_id: item.id,
                              status,
                              notes: item.notes ?? "",
                            });
                          }}
                        >
                          <option value="not_started">not started</option>
                          <option value="in_progress">in progress</option>
                          <option value="needs_followup">needs followup</option>
                          <option value="cleared">cleared</option>
                          <option value="blocked">blocked</option>
                        </select>
                      </div>
                      <textarea
                        className="mt-2 min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={item.notes ?? ""}
                        onChange={(e) => updateLocalChecklist(item.id, { notes: e.target.value })}
                        onBlur={() =>
                          callDiligence(selectedSeller.id, {
                            action: "checklist_update",
                            item_id: item.id,
                            status: item.status,
                            notes: item.notes ?? "",
                          })
                        }
                        placeholder="Evidence, caveats, or links..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Questions for seller</h3>
                <div className="mb-3 flex gap-2">
                  <input
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Add a question..."
                  />
                  <Button
                    type="button"
                    disabled={!newQuestion.trim() || saving}
                    onClick={async () => {
                      await callDiligence(selectedSeller.id, {
                        action: "question_create",
                        question: newQuestion,
                      });
                      setNewQuestion("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {currentQuestions.map((q) => (
                    <div key={q.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{q.question}</p>
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={q.status}
                          onChange={(e) =>
                            updateLocalQuestion(q.id, {
                              status: e.target.value as DealDiligenceQuestion["status"],
                            })
                          }
                        >
                          <option value="open">open</option>
                          <option value="answered">answered</option>
                          <option value="closed">closed</option>
                        </select>
                      </div>
                      <textarea
                        className="mt-2 min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={q.answer ?? ""}
                        onChange={(e) => updateLocalQuestion(q.id, { answer: e.target.value })}
                        placeholder="Seller response..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 h-8"
                        onClick={() =>
                          callDiligence(selectedSeller.id, {
                            action: "question_update",
                            question_id: q.id,
                            answer: q.answer ?? "",
                            status: q.status,
                          })
                        }
                      >
                        Save question
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Risk register</h3>
                <div className="mb-3 flex gap-2">
                  <input
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value)}
                    placeholder="Add a risk..."
                  />
                  <Button
                    type="button"
                    disabled={!newRisk.trim() || saving}
                    onClick={async () => {
                      await callDiligence(selectedSeller.id, {
                        action: "risk_create",
                        title: newRisk,
                      });
                      setNewRisk("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {currentRisks.map((risk) => (
                    <div key={risk.id} className="rounded-md border p-3">
                      <input
                        className="mb-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                        value={risk.title}
                        onChange={(e) => updateLocalRisk(risk.id, { title: e.target.value })}
                      />
                      <div className="grid gap-2 md:grid-cols-3">
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={risk.severity}
                          onChange={(e) =>
                            updateLocalRisk(risk.id, {
                              severity: e.target.value as DealDiligenceRisk["severity"],
                            })
                          }
                        >
                          <option value="low">low severity</option>
                          <option value="medium">medium severity</option>
                          <option value="high">high severity</option>
                        </select>
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={risk.probability}
                          onChange={(e) =>
                            updateLocalRisk(risk.id, {
                              probability: e.target.value as DealDiligenceRisk["probability"],
                            })
                          }
                        >
                          <option value="low">low probability</option>
                          <option value="medium">medium probability</option>
                          <option value="high">high probability</option>
                        </select>
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={risk.status}
                          onChange={(e) =>
                            updateLocalRisk(risk.id, {
                              status: e.target.value as DealDiligenceRisk["status"],
                            })
                          }
                        >
                          <option value="open">open</option>
                          <option value="mitigated">mitigated</option>
                          <option value="accepted">accepted</option>
                        </select>
                      </div>
                      <textarea
                        className="mt-2 min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={risk.mitigation ?? ""}
                        onChange={(e) => updateLocalRisk(risk.id, { mitigation: e.target.value })}
                        placeholder="Mitigation plan..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 h-8"
                        onClick={() =>
                          callDiligence(selectedSeller.id, {
                            action: "risk_update",
                            risk_id: risk.id,
                            title: risk.title,
                            severity: risk.severity,
                            probability: risk.probability,
                            mitigation: risk.mitigation ?? "",
                            decision_impact: risk.decision_impact ?? "",
                            status: risk.status,
                          })
                        }
                      >
                        Save risk
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
