import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { AppError } from "../errors/errors.js";
import { logEvent } from "../observability/logger.js";

const UPLOAD_BUCKETS: Record<UploadPurpose, string> = {
  pdf: "openedup-pdfs",
  image: "openedup-images",
  "skill-package": "openedup-skill-packages",
};
const GENERATED_FILES_BUCKET = "openedup-generated-files";
const GENERATED_FILE_MAX_BYTES = 25 * 1024 * 1024;
export const MAX_PDF_UPLOAD_BYTES = 100 * 1024 * 1024;

export type UploadPurpose = "pdf" | "image" | "skill-package";

const MIME_TYPES: Record<UploadPurpose, ReadonlySet<string>> = {
  pdf: new Set(["application/pdf"]),
  image: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  "skill-package": new Set([
    "application/zip",
    "application/x-zip-compressed",
    "text/markdown",
    "text/plain",
  ]),
};

const MAX_BYTES: Record<UploadPurpose, number> = {
  pdf: MAX_PDF_UPLOAD_BYTES,
  image: 10 * 1024 * 1024,
  "skill-package": 20 * 1024 * 1024,
};

let adminClient: SupabaseClient | null = null;

export function getSupabaseStorageAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env["SUPABASE_URL"]?.trim();
  const secretKey =
    process.env["SUPABASE_SECRET_KEY"]?.trim() || process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !secretKey) {
    throw new AppError("Supabase Storage is not configured on the server.", 503);
  }

  adminClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return adminClient;
}

function extensionFor(fileName: string, contentType: string, purpose: UploadPurpose): string {
  if (purpose === "pdf") return ".pdf";
  if (purpose === "image") {
    const extensionByType: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    return extensionByType[contentType] || ".img";
  }

  const extension = fileName.toLowerCase().match(/\.(zip|md|markdown|txt)$/)?.[0];
  if (!extension) throw new AppError("Skill uploads must be ZIP, Markdown, or text files.", 400);
  return extension;
}

export async function createSignedUpload(input: {
  userId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  purpose: UploadPurpose;
}): Promise<{ bucket: string; path: string; token: string }> {
  const { userId, fileName, contentType, sizeBytes, purpose } = input;
  if (!MIME_TYPES[purpose].has(contentType)) {
    throw new AppError("The file type is not allowed for this upload.", 415);
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_BYTES[purpose]) {
    throw new AppError(
      `The file exceeds the ${Math.floor(MAX_BYTES[purpose] / 1024 / 1024)} MB upload limit.`,
      413
    );
  }

  const extension = extensionFor(fileName, contentType, purpose);
  const path = `${userId}/${purpose}/${crypto.randomUUID()}${extension}`;
  const { data, error } = await getSupabaseStorageAdmin()
    .storage.from(UPLOAD_BUCKETS[purpose])
    .createSignedUploadUrl(path, { upsert: false });
  if (error || !data) {
    throw new AppError("Could not prepare the file upload. Check the Supabase Storage setup.", 503);
  }
  return { bucket: UPLOAD_BUCKETS[purpose], path: data.path, token: data.token };
}

export async function downloadUserUpload(
  userId: string,
  objectPath: string,
  purpose: UploadPurpose
): Promise<Buffer> {
  if (!isOwnedUploadPath(userId, objectPath, purpose)) {
    throw new AppError("The uploaded file is not available to this account.", 403);
  }
  const { data, error } = await getSupabaseStorageAdmin()
    .storage.from(UPLOAD_BUCKETS[purpose])
    .download(objectPath);
  if (error || !data) throw new AppError("The uploaded file could not be read.", 404);
  const bytes = Buffer.from(await data.arrayBuffer());
  if (bytes.length > MAX_BYTES[purpose]) {
    throw new AppError("The uploaded file exceeds the maximum size.", 413);
  }
  return bytes;
}

export async function downloadUserImage(
  userId: string,
  objectPath: string,
  contentType: string
): Promise<Buffer> {
  const bytes = await downloadUserUpload(userId, objectPath, "image");
  const valid =
    (contentType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (contentType === "image/png" &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (contentType === "image/gif" && /^GIF8[79]a/.test(bytes.subarray(0, 6).toString("ascii"))) ||
    (contentType === "image/webp" &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP");
  if (!valid) throw new AppError("The uploaded image does not match its declared file type.", 415);
  return bytes;
}

export async function deleteUserUploads(userId: string, objectPaths: string[]): Promise<void> {
  const ownedPaths = objectPaths.filter((objectPath) => isOwnedUploadPath(userId, objectPath));
  if (ownedPaths.length === 0) return;
  const groupedPaths = new Map<UploadPurpose, string[]>();
  for (const objectPath of ownedPaths) {
    const purpose = objectPath.split("/")[1] as UploadPurpose;
    const paths = groupedPaths.get(purpose);
    if (paths) paths.push(objectPath);
    else groupedPaths.set(purpose, [objectPath]);
  }
  try {
    const results = await Promise.all(
      [...groupedPaths].map(async ([purpose, paths]) => ({
        purpose,
        result: await getSupabaseStorageAdmin().storage.from(UPLOAD_BUCKETS[purpose]).remove(paths),
      }))
    );
    for (const { purpose, result } of results) {
      if (result.error) logEvent("WARN Supabase upload cleanup failed", { purpose });
    }
  } catch (error) {
    logEvent("WARN Supabase upload cleanup failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
  }
}

export async function storeGeneratedFile(input: {
  userId: string;
  conversationId: string;
  fileName: string;
  bytes: Buffer;
}): Promise<{ objectKey: string; sizeBytes: number }> {
  const { userId, conversationId, bytes } = input;
  const fileName = input.fileName.replace(/[\\/\0-\x1f\x7f]/g, "_").slice(0, 180) || "download";
  if (!userId || !conversationId || userId.includes("/") || conversationId.includes("/")) {
    throw new AppError("Invalid owner or conversation for generated file.", 400);
  }
  if (!bytes.length || bytes.length > GENERATED_FILE_MAX_BYTES) {
    throw new AppError("Generated files must be between 1 byte and 25 MB.", 413);
  }
  const objectKey = `${crypto.randomUUID()}-${fileName}`;
  const objectPath = `${userId}/${conversationId}/${objectKey}`;
  const { error } = await getSupabaseStorageAdmin()
    .storage.from(GENERATED_FILES_BUCKET)
    .upload(objectPath, bytes, { contentType: "application/octet-stream", upsert: false });
  if (error) throw new AppError("Could not save the generated file.", 503);
  return { objectKey, sizeBytes: bytes.length };
}

export async function downloadGeneratedFile(
  userId: string,
  conversationId: string,
  objectKey: string
): Promise<{ signedUrl: string } | null> {
  if (!userId || !conversationId || userId.includes("/") || conversationId.includes("/"))
    return null;
  const match = /^([0-9a-f-]{36})-(.+)$/i.exec(objectKey);
  if (!match || objectKey.length > 240 || objectKey.includes("/") || objectKey.includes("\\"))
    return null;
  const { data, error } = await getSupabaseStorageAdmin()
    .storage.from(GENERATED_FILES_BUCKET)
    .createSignedUrl(`${userId}/${conversationId}/${objectKey}`, 60, { download: match[2]! });
  if (error || !data) return null;
  return { signedUrl: data.signedUrl };
}

/** Deletes old, unprocessed objects in the three signed-upload staging buckets. */
export async function cleanupAbandonedUploads(options?: {
  olderThanMs?: number;
  maxDeletes?: number;
}): Promise<number> {
  const cutoff = Date.now() - (options?.olderThanMs ?? 24 * 60 * 60 * 1000);
  const maxDeletes = options?.maxDeletes ?? 1000;
  const client = getSupabaseStorageAdmin();
  let deleted = 0;

  for (const [purpose, bucketName] of Object.entries(UPLOAD_BUCKETS) as Array<
    [UploadPurpose, string]
  >) {
    const remainingBudget = maxDeletes - deleted;
    if (remainingBudget <= 0) break;
    const stalePaths: string[] = [];
    let visitedDirectories = 0;
    const visit = async (prefix: string): Promise<void> => {
      if (++visitedDirectories > 10000 || stalePaths.length >= remainingBudget) return;
      const directories: string[] = [];
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await client.storage.from(bucketName).list(prefix, {
          limit: 100,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw new AppError(`Could not list abandoned ${purpose} uploads.`, 503);
        const entries = data ?? [];
        for (const entry of entries) {
          const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.id === null) directories.push(objectPath);
          else if (entry.created_at && Date.parse(entry.created_at) < cutoff)
            stalePaths.push(objectPath);
        }
        if (entries.length < 100 || stalePaths.length >= remainingBudget) break;
      }
      for (const directory of directories) await visit(directory);
    };
    await visit("");
    for (let index = 0; index < stalePaths.length; index += 100) {
      const { error } = await client.storage
        .from(bucketName)
        .remove(stalePaths.slice(index, index + 100));
      if (error) throw new AppError(`Could not remove abandoned ${purpose} uploads.`, 503);
      deleted += Math.min(100, stalePaths.length - index);
    }
  }
  return deleted;
}

export function isOwnedUploadPath(
  userId: string,
  objectPath: string,
  purpose?: UploadPurpose
): boolean {
  if (!userId || !objectPath || objectPath.length > 500 || objectPath.includes("\\")) return false;
  const segments = objectPath.split("/");
  return (
    segments.length === 3 &&
    segments[0] === userId &&
    ["pdf", "image", "skill-package"].includes(segments[1] || "") &&
    (!purpose || segments[1] === purpose) &&
    /^[0-9a-f-]{36}\.(pdf|jpg|png|webp|gif|zip|md|markdown|txt|img)$/i.test(segments[2] || "")
  );
}
