import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readStore, requireMongoEnabled, updateStore } from "../server/lib/store";
import { uploadBufferToGridFs } from "../server/lib/gridfs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const uploadsRoot = path.join(workspaceRoot, "uploads");

type MigrationStats = {
  scannedStrings: number;
  migratedReferences: number;
  uploadedFiles: number;
  deletedLocalFiles: number;
  skippedMissing: number;
  skippedUnsupported: number;
  failed: number;
};

const stats: MigrationStats = {
  scannedStrings: 0,
  migratedReferences: 0,
  uploadedFiles: 0,
  deletedLocalFiles: 0,
  skippedMissing: 0,
  skippedUnsupported: 0,
  failed: 0,
};

const migratedUrlByLegacyUrl = new Map<string, string | null>();

function contentTypeFromPath(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return null;
}

function legacyUploadPathFromValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
  } catch {
    // Relative URL; handled below.
  }

  return trimmed.startsWith("/uploads/") ? trimmed : null;
}

function localFilePathFromLegacyUrl(legacyUrl: string): string | null {
  const relativePath = legacyUrl.replace(/^\/uploads\//, "").replace(/\//g, path.sep);
  const resolved = path.resolve(uploadsRoot, relativePath);
  if (!resolved.startsWith(uploadsRoot)) return null;
  return resolved;
}

async function migrateLegacyUrl(legacyUrl: string): Promise<string | null> {
  if (migratedUrlByLegacyUrl.has(legacyUrl)) {
    return migratedUrlByLegacyUrl.get(legacyUrl) || null;
  }

  const filePath = localFilePathFromLegacyUrl(legacyUrl);
  if (!filePath) {
    stats.skippedUnsupported += 1;
    migratedUrlByLegacyUrl.set(legacyUrl, null);
    return null;
  }

  const contentType = contentTypeFromPath(filePath);
  if (!contentType) {
    stats.skippedUnsupported += 1;
    migratedUrlByLegacyUrl.set(legacyUrl, null);
    console.warn(`Skipping unsupported upload type: ${legacyUrl}`);
    return null;
  }

  try {
    const buffer = await readFile(filePath);
    const uploaded = await uploadBufferToGridFs({
      filename: path.basename(filePath),
      contentType,
      buffer,
      metadata: {
        migratedFrom: legacyUrl,
        kind: contentType.startsWith("image/") ? "image" : "document",
      },
    });
    stats.uploadedFiles += 1;
    migratedUrlByLegacyUrl.set(legacyUrl, uploaded.url);

    try {
      await unlink(filePath);
      stats.deletedLocalFiles += 1;
    } catch (error) {
      console.warn(`Uploaded but could not delete local file ${legacyUrl}:`, error);
    }

    console.log(`Migrated ${legacyUrl} -> ${uploaded.url}`);
    return uploaded.url;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      stats.skippedMissing += 1;
      console.warn(`Missing local file, leaving reference unchanged: ${legacyUrl}`);
    } else {
      stats.failed += 1;
      console.warn(`Failed to migrate ${legacyUrl}:`, error);
    }
    migratedUrlByLegacyUrl.set(legacyUrl, null);
    return null;
  }
}

async function migrateValue(value: unknown): Promise<unknown> {
  if (typeof value === "string") {
    stats.scannedStrings += 1;
    const legacyUrl = legacyUploadPathFromValue(value);
    if (!legacyUrl) return value;
    const migratedUrl = await migrateLegacyUrl(legacyUrl);
    if (!migratedUrl) return value;
    stats.migratedReferences += 1;
    return migratedUrl;
  }

  if (Array.isArray(value)) {
    const migrated = [];
    for (const item of value) {
      migrated.push(await migrateValue(item));
    }
    return migrated;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const [key, entry] of Object.entries(record)) {
      record[key] = await migrateValue(entry);
    }
    return record;
  }

  return value;
}

async function main() {
  requireMongoEnabled();
  const store = await readStore();
  const migratedStore = await migrateValue(structuredClone(store));

  await updateStore((currentStore) => {
    Object.assign(currentStore, migratedStore);
  });

  console.log("GridFS upload migration complete.");
  console.table(stats);
}

main().catch((error) => {
  console.error("GridFS upload migration failed:", error);
  process.exitCode = 1;
});
