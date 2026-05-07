import "server-only";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getPipelineToken(): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is not set");
  const data = new TextEncoder().encode(`aqüira_pipeline_v1:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest)).slice(0, 16);
}

export async function getPipelinePath(): Promise<string> {
  const token = await getPipelineToken();
  return `/admin/pipeline/${token}`;
}
