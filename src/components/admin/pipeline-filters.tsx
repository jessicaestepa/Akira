"use client";

interface PipelineFiltersProps {
  stage: string;
  setStage: (value: string) => void;
  businessType: string;
  setBusinessType: (value: string) => void;
  starredOnly: boolean;
  setStarredOnly: (value: boolean) => void;
  search: string;
  setSearch: (value: string) => void;
  minScore: number;
  setMinScore: (value: number) => void;
}

export function PipelineFilters(props: PipelineFiltersProps) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
      <input
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Search company or notes"
        value={props.search}
        onChange={(e) => props.setSearch(e.target.value)}
      />
      <select
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={props.stage}
        onChange={(e) => props.setStage(e.target.value)}
      >
        <option value="all">All stages</option>
        <option value="new">New</option>
        <option value="reviewing">Reviewing</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="lp_ready">LP-ready</option>
        <option value="passed">Passed</option>
      </select>
      <input
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Business type"
        value={props.businessType}
        onChange={(e) => props.setBusinessType(e.target.value)}
      />
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:col-span-2">
        <span className="shrink-0 text-sm text-muted-foreground whitespace-nowrap">
          Min score
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={props.minScore}
            onChange={(e) => props.setMinScore(Number(e.target.value))}
            className="h-2 w-full min-w-0 flex-1 cursor-pointer accent-primary"
          />
          <span className="shrink-0 w-9 text-right text-sm font-medium tabular-nums text-foreground">
            {props.minScore}
          </span>
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={props.starredOnly}
          onChange={(e) => props.setStarredOnly(e.target.checked)}
        />
        Starred only
      </label>
    </div>
  );
}
