import path from "node:path";
import { randomBytes } from "node:crypto";
import { assertValidImageContentType, uploadBufferToGridFs } from "./gridfs";

function sanitizeBaseName(filename: string): string {
  const base = path.parse(filename).name;
  const cleaned = base.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "file";
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

function gridFilename(filename: string, contentType: string, fallbackExtension: string) {
  const extension = path.extname(filename) || fallbackExtension;
  return `${Date.now()}-${randomBytes(4).toString("hex")}-${sanitizeBaseName(filename)}${extension}`;
}

export async function saveBase64Image(input: {
  filename: string;
  contentType: string;
  base64Data: string;
  folder: string;
}): Promise<string> {
  assertValidImageContentType(input.contentType);
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

  const uploaded = await uploadBufferToGridFs({
    filename: gridFilename(input.filename, input.contentType, extension),
    contentType: input.contentType,
    buffer,
    metadata: {
      originalName: input.filename,
      category: input.folder,
      kind: "image",
    },
  });

  return uploaded.url;
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

  const uploaded = await uploadBufferToGridFs({
    filename: gridFilename(input.filename, input.contentType, extension),
    contentType: input.contentType,
    buffer,
    metadata: {
      originalName: input.filename,
      category: input.folder,
      kind: "document",
    },
  });

  return {
    url: uploaded.url,
    sizeBytes: uploaded.sizeBytes,
  };
}
