import { Router, type Request } from "express";
import {
  CreateGalleryImageBody,
  DeleteGalleryImageParams,
  UpdateGalleryImageBody,
  UpdateGalleryImageParams,
} from "@workspace/api-zod";
import { createAuditLogEntry, nextNumericId, readStore, updateStore, type GalleryImageRecord } from "../lib/store";
import { requireAdmin } from "../lib/auth";
import { saveBase64Image } from "../lib/uploads";
import { deleteGridFsFileByUrl } from "../lib/gridfs";

const router = Router();
const galleryFolder = "gallery";
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function getPublicBaseUrl(req: Request): string {
  const configured = process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.APP_PUBLIC_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

function toFullUrl(req: Request, url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${getPublicBaseUrl(req)}${url.startsWith("/") ? url : `/${url}`}`;
}

function normalizeStoredUrl(req: Request, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/api/images/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep relative URLs as-is.
  }
  return trimmed;
}

function toGalleryResponse(req: Request, image: GalleryImageRecord) {
  return {
    id: image.id,
    name: image.name || image.url.split("/").pop() || `image-${image.id}`,
    url: toFullUrl(req, image.url),
    relativeUrl: image.url,
    caption: image.caption,
    category: image.category,
    contentType: image.contentType ?? null,
    sizeBytes: image.sizeBytes ?? null,
    uploadedByUserId: image.uploadedByUserId ?? null,
    uploadedByName: image.uploadedByName ?? null,
    sortOrder: image.sortOrder,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt ?? null,
  };
}

async function updateGalleryImage(req: Request, imageId: number, body: Record<string, unknown>) {
  const filename = typeof body.filename === "string" ? body.filename : "";
  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const base64Data = typeof body.base64Data === "string" ? body.base64Data : "";

  if (base64Data && (!filename || !supportedImageTypes.has(contentType))) {
    throw new Error("Replacement image must be JPG, PNG, or WEBP");
  }

  const before = await readStore();
  const previous = before.gallery.find((entry) => entry.id === imageId);
  const replacementUrl = base64Data
    ? await saveBase64Image({ filename, contentType, base64Data, folder: galleryFolder })
    : null;
  const replacementSize = base64Data ? Buffer.from(base64Data, "base64").length : null;

  const updated = await updateStore((store) => {
    const image = store.gallery.find((entry) => entry.id === imageId);
    if (!image) return null;
    if (typeof body.url === "string" && body.url.trim()) image.url = normalizeStoredUrl(req, body.url);
    if (replacementUrl) {
      image.name = filename;
      image.url = replacementUrl;
      image.contentType = contentType;
      image.sizeBytes = replacementSize;
    }
    if (typeof body.caption === "string") image.caption = body.caption.trim() || null;
    if (body.caption === null) image.caption = null;
    if (typeof body.category === "string") image.category = body.category.trim() || null;
    if (body.category === null) image.category = null;
    const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : Number(body.sortOrder);
    if (!Number.isNaN(sortOrder)) image.sortOrder = sortOrder;
    image.updatedAt = new Date().toISOString();
    store.auditLogs.unshift(
      createAuditLogEntry({
        actorUserId: req.authUser?.id,
        actorName: req.authUser?.name || req.authUser?.email || "Admin",
        actorRole: req.authUser?.role || "admin",
        action: "gallery.image.updated",
        entityType: "gallery",
        entityId: String(image.id),
        summary: `Updated gallery image ${image.name || image.url}`,
      }),
    );
    return image;
  });

  if (replacementUrl && previous) {
    await deleteGridFsFileByUrl(previous.url).catch((error) => {
      req.log.warn({ err: error, url: previous.url }, "Failed to delete old GridFS gallery image");
    });
  }

  return updated;
}

router.get("/", async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json([...store.gallery].sort((a, b) => a.sortOrder - b.sortOrder).map((image) => toGalleryResponse(req, image)));
  } catch (err) {
    req.log.error({ err }, "Failed to list gallery images");
    res.status(500).json({ error: "Failed to list gallery images" });
  }
});

router.get("/:imageId", async (req, res): Promise<void> => {
  const imageId = Number(req.params.imageId);
  if (Number.isNaN(imageId)) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }
  try {
    const store = await readStore();
    const image = store.gallery.find((entry) => entry.id === imageId);
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json(toGalleryResponse(req, image));
  } catch (err) {
    req.log.error({ err }, "Failed to get gallery image");
    res.status(500).json({ error: "Failed to get gallery image" });
  }
});

router.post("/upload", requireAdmin, async (req, res): Promise<void> => {
  const filename = typeof req.body?.filename === "string" ? req.body.filename : "";
  const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "";
  const base64Data = typeof req.body?.base64Data === "string" ? req.body.base64Data : "";
  const caption = typeof req.body?.caption === "string" ? req.body.caption.trim() : "";
  const category = typeof req.body?.category === "string" ? req.body.category.trim() : "";
  const rawSortOrder = req.body?.sortOrder;
  const sortOrder =
    typeof rawSortOrder === "number"
      ? rawSortOrder
      : typeof rawSortOrder === "string" && rawSortOrder.trim() !== ""
        ? Number(rawSortOrder)
        : 0;

  if (!filename || !contentType || !base64Data) {
    res.status(400).json({ error: "filename, contentType and base64Data are required" });
    return;
  }
  if (!supportedImageTypes.has(contentType)) {
    res.status(400).json({ error: "Only JPG, PNG, and WEBP images are supported" });
    return;
  }
  if (Number.isNaN(sortOrder)) {
    res.status(400).json({ error: "sortOrder must be a number" });
    return;
  }

  try {
    const url = await saveBase64Image({ filename, contentType, base64Data, folder: galleryFolder });
    const sizeBytes = Buffer.from(base64Data, "base64").length;
    const created = await updateStore((store) => {
      const image: GalleryImageRecord = {
        id: nextNumericId(store.gallery),
        name: filename,
        url,
        caption: caption || null,
        category: category || null,
        contentType,
        sizeBytes,
        uploadedByUserId: req.authUser?.id ?? null,
        uploadedByName: req.authUser?.name || req.authUser?.email || "Admin",
        sortOrder,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };
      store.gallery.push(image);
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "gallery.image.uploaded",
          entityType: "gallery",
          entityId: String(image.id),
          summary: `Uploaded gallery image ${image.name}`,
        }),
      );
      return image;
    });

    res.status(201).json(toGalleryResponse(req, created));
  } catch (err) {
    req.log.error({ err }, "Failed to upload gallery image");
    await updateStore((store) => {
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "gallery.image.upload.error",
          entityType: "error",
          entityId: "gallery-upload",
          summary: err instanceof Error ? err.message : "Failed to upload gallery image",
        }),
      );
    });
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to upload gallery image" });
  }
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const result = CreateGalleryImageBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  try {
    const created = await updateStore((store) => {
      const image: GalleryImageRecord = {
        id: nextNumericId(store.gallery),
        name: result.data.url.split("/").pop() || null,
        url: normalizeStoredUrl(req, result.data.url),
        caption: result.data.caption ?? null,
        category: result.data.category ?? null,
        sortOrder: result.data.sortOrder ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };
      store.gallery.push(image);
      return image;
    });
    res.status(201).json(toGalleryResponse(req, created));
  } catch (err) {
    req.log.error({ err }, "Failed to create gallery image");
    res.status(500).json({ error: "Failed to create gallery image" });
  }
});

router.patch("/:imageId", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateGalleryImageParams.safeParse({ imageId: Number(req.params.imageId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }
  const body = UpdateGalleryImageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const updated = await updateGalleryImage(req, params.data.imageId, body.data);
    if (!updated) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json(toGalleryResponse(req, updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update gallery image");
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to update gallery image" });
  }
});

router.put("/:imageId", requireAdmin, async (req, res): Promise<void> => {
  const imageId = Number(req.params.imageId);
  if (Number.isNaN(imageId)) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }
  try {
    const updated = await updateGalleryImage(req, imageId, req.body || {});
    if (!updated) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json(toGalleryResponse(req, updated));
  } catch (err) {
    req.log.error({ err }, "Failed to replace gallery image");
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to replace gallery image" });
  }
});

router.delete("/:imageId", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteGalleryImageParams.safeParse({ imageId: Number(req.params.imageId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }
  try {
    const removed = await updateStore((store) => {
      const image = store.gallery.find((entry) => entry.id === params.data.imageId);
      if (!image) return null;
      store.gallery = store.gallery.filter((entry) => entry.id !== params.data.imageId);
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "gallery.image.deleted",
          entityType: "gallery",
          entityId: String(image.id),
          summary: `Deleted gallery image ${image.name || image.url}`,
        }),
      );
      return image;
    });
    if (!removed) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    await deleteGridFsFileByUrl(removed.url).catch((error) => {
      req.log.warn({ err: error, url: removed.url }, "Failed to delete GridFS gallery image");
    });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete gallery image");
    res.status(500).json({ error: "Failed to delete gallery image" });
  }
});

export default router;
