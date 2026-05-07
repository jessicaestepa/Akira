import { notFound } from "next/navigation";
import { getPipelineToken } from "@/lib/auth/pipeline-path";
import { PipelineContent } from "../pipeline-content";

export const dynamic = "force-dynamic";

export default async function SecurePipelinePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const expected = await getPipelineToken();
  if (token !== expected) notFound();

  return <PipelineContent />;
}
