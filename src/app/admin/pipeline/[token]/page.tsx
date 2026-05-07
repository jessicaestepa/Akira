import { redirect } from "next/navigation";
import { getPipelinePath, getPipelineToken } from "@/lib/auth/pipeline-path";
import { PipelineContent } from "../pipeline-content";
import { requireAdminSession } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

export default async function SecurePipelinePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await requireAdminSession();
  const { token } = await params;
  const expected = await getPipelineToken();
  if (token !== expected) {
    const canonicalPath = await getPipelinePath();
    redirect(canonicalPath);
  }

  return <PipelineContent />;
}
