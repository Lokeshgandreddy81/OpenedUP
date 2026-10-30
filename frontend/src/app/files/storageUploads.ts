import { authenticatedChatFetch } from "../api/chatApi";
import { requireSupabase } from "../integrations/supabaseClient";

export type UploadPurpose = "pdf" | "image" | "skill-package" | "project-snapshot";

function contentTypeFor(file: Blob, fileName: string, purpose: UploadPurpose): string {
  if (purpose === "pdf") return "application/pdf";
  if (purpose === "skill-package") {
    if (/\.zip$/i.test(fileName)) return "application/zip";
    if (/\.(md|markdown)$/i.test(fileName)) return "text/markdown";
    return "text/plain";
  }
  if (purpose === "project-snapshot") return "application/json";
  const type = file.type.toLowerCase().split(";")[0]?.trim();
  return type === "image/jpg" ? "image/jpeg" : type || "image/jpeg";
}

export function base64ToBlob(base64Data: string, contentType: string): Blob {
  const cleanBase64 = base64Data.includes(",")
    ? base64Data.slice(base64Data.indexOf(",") + 1)
    : base64Data;
  const binary = atob(cleanBase64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: contentType });
}

export async function uploadBlobForProcessing(
  file: Blob,
  fileName: string,
  purpose: UploadPurpose,
  expectedUserId?: string
): Promise<string> {
  const contentType = contentTypeFor(file, fileName, purpose);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (expectedUserId) headers["X-Expected-User-Id"] = expectedUserId;
  const response = await authenticatedChatFetch(
    "/api/uploads/signed",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ purpose, fileName, contentType, sizeBytes: file.size }),
    },
    expectedUserId
  );
  const data = (await response.json().catch(() => ({}))) as {
    bucket?: string;
    path?: string;
    token?: string;
    error?: string;
  };
  if (!response.ok || !data.bucket || !data.path || !data.token) {
    throw new Error(data.error || `Could not prepare ${fileName} for upload.`);
  }

  const { error } = await requireSupabase()
    .storage.from(data.bucket)
    .uploadToSignedUrl(data.path, data.token, file, { contentType, upsert: false });
  if (error) throw new Error(`Could not upload ${fileName}: ${error.message}`);
  return data.path;
}
