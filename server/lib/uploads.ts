import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, "../../uploads");

function sanitizeBaseName(filename: string): string {
  const base = path.parse(filename).name;
  const cleaned = base.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "image";
}

function extensionFromMimeType(contentType: string): string | null {
  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return null;
  }
}

function extensionFromDocumentMimeType(contentType: string): string | null {
  switch (contentType) {
    case "application/pdf":
      return ".pdf";
    case "application/msword":
      return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    default:
      return null;
  }
}

export async function saveBase64Image(input: {
  filename: string;
  contentType: string;
  base64Data: string;
  folder: string;
}): Promise<string> {
  const extension = extensionFromMimeType(input.contentType);
  if (!extension) {
    throw new Error("Unsupported image type");
  }

  const buffer = Buffer.from(input.base64Data, "base64");
  if (buffer.length === 0) {
    throw new Error("Uploaded image is empty");
  }
  if (buffer.length > 15 * 1024 * 1024) {
    throw new Error("Uploaded image must be 15MB or smaller");
  }

  const targetDir = path.join(uploadsRoot, input.folder);
  await mkdir(targetDir, { recursive: true });

  const fileName = `${Date.now()}-${randomBytes(4).toString("hex")}-${sanitizeBaseName(input.filename)}${extension}`;
  await writeFile(path.join(targetDir, fileName), buffer);

  return `/uploads/${input.folder}/${fileName}`;
}

export async function saveBase64Document(input: {
  filename: string;
  contentType: string;
  base64Data: string;
  folder: string;
}): Promise<{ url: string; sizeBytes: number }> {
  const extension = extensionFromDocumentMimeType(input.contentType);
  if (!extension) {
    throw new Error("Unsupported document type");
  }

  const buffer = Buffer.from(input.base64Data, "base64");
  if (buffer.length === 0) {
    throw new Error("Uploaded document is empty");
  }
  if (buffer.length > 20 * 1024 * 1024) {
    throw new Error("Uploaded document must be 20MB or smaller");
  }

  const targetDir = path.join(uploadsRoot, input.folder);
  await mkdir(targetDir, { recursive: true });

  const fileName = `${Date.now()}-${randomBytes(4).toString("hex")}-${sanitizeBaseName(input.filename)}${extension}`;
  await writeFile(path.join(targetDir, fileName), buffer);

  return {
    url: `/uploads/${input.folder}/${fileName}`,
    sizeBytes: buffer.length,
  };
}

export function getUploadsRoot(): string {
  return uploadsRoot;
}
