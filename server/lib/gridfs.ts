import { Readable } from "node:stream";
import { GridFSBucket, ObjectId, type GridFSFile } from "mongodb";
import { getMongoDb, requireMongoEnabled } from "./store";

const bucketName = process.env.GRIDFS_BUCKET || "uploads";

let bucketPromise: Promise<GridFSBucket> | null = null;

export function isGridFsUrl(value?: string | null): boolean {
  return typeof value === "string" && /^\/api\/images\/[a-f\d]{24}$/i.test(value);
}

export function gridFsUrl(id: ObjectId | string): string {
  return `/api/images/${String(id)}`;
}

export function gridFsIdFromUrl(value?: string | null): ObjectId | null {
  if (!isGridFsUrl(value)) return null;
  const id = String(value).split("/").pop() || "";
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export function assertValidImageContentType(contentType: string): void {
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType)) {
    throw new Error("Unsupported image type");
  }
}

async function getGridFsBucket(): Promise<GridFSBucket> {
  requireMongoEnabled();
  if (!bucketPromise) {
    bucketPromise = getMongoDb().then((db) => new GridFSBucket(db, { bucketName }));
  }
  return bucketPromise;
}

export async function uploadBufferToGridFs(input: {
  filename: string;
  contentType: string;
  buffer: Buffer;
  metadata?: Record<string, unknown>;
}): Promise<{ id: ObjectId; url: string; sizeBytes: number }> {
  if (input.buffer.length === 0) {
    throw new Error("Uploaded file is empty");
  }

  const bucket = await getGridFsBucket();
  const uploadStream = bucket.openUploadStream(input.filename, {
    contentType: input.contentType,
    metadata: input.metadata,
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(input.buffer)
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => resolve());
  });

  return {
    id: uploadStream.id as ObjectId,
    url: gridFsUrl(uploadStream.id as ObjectId),
    sizeBytes: input.buffer.length,
  };
}

export async function findGridFsFile(id: ObjectId): Promise<GridFSFile | null> {
  const bucket = await getGridFsBucket();
  const files = await bucket.find({ _id: id }).limit(1).toArray();
  return files[0] || null;
}

export async function openGridFsDownloadStream(id: ObjectId) {
  const bucket = await getGridFsBucket();
  return bucket.openDownloadStream(id);
}

export async function deleteGridFsFileById(id: ObjectId): Promise<boolean> {
  const bucket = await getGridFsBucket();
  try {
    await bucket.delete(id);
    return true;
  } catch (error) {
    if (error instanceof Error && /FileNotFound/i.test(error.message)) {
      return false;
    }
    throw error;
  }
}

export async function deleteGridFsFileByUrl(value?: string | null): Promise<boolean> {
  const id = gridFsIdFromUrl(value);
  if (!id) return false;
  return deleteGridFsFileById(id);
}
