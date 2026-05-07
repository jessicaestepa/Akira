import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PipelineStatsProps {
  totalDeals: number;
  shortlisted: number;
  lpReady: number;
  avgScore: number;
  topSectors: Array<{ sector: string; count: number }>;
  averageAsking: number;
  averageMultiple: number;
  pipelineValue: number;
}

function fmtMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PipelineStats(props: PipelineStatsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Pipeline Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
        <div>
          <p className="text-muted-foreground">Pipeline Funnel</p>
          <p className="font-medium">
            {props.totalDeals} deals, {props.shortlisted} shortlisted, {props.lpReady} LP-ready
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Average Thesis Fit</p>
          <p className="font-medium">{props.avgScore.toFixed(1)}/100</p>
        </div>
        <div>
          <p className="text-muted-foreground">Top Sectors</p>
          <p className="font-medium">
            {props.topSectors.length
              ? props.topSectors.map((x) => `${x.sector} (${x.count})`).join(", ")
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Value Snapshot</p>
          <p className="font-medium">
            Avg Asking {fmtMoney(props.averageAsking)} | Avg Multiple {props.averageMultiple.toFixed(1)}x
          </p>
          <p className="text-muted-foreground">Shortlisted pipeline value: {fmtMoney(props.pipelineValue)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
