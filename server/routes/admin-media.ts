import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { createAuditLogEntry, nextNumericId, readStore, updateStore, type GalleryImageRecord } from "../lib/store";
import { requireAdmin } from "../lib/auth";
import { getUploadsRoot, saveBase64Image } from "../lib/uploads";

const router = Router();
const mediaFolder = "gallery";

function contentTypeFromName(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return null;
}

function toMediaResponse(image: GalleryImageRecord) {
  return {
    id: image.id,
    name: image.name || image.url.split("/").pop() || `image-${image.id}`,
    url: image.url,
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

function localPathFromUrl(url: string): string | null {
  if (!url.startsWith(`/uploads/${mediaFolder}/`)) return null;
  const uploadsRoot = getUploadsRoot();
  const relative = url.replace(/^\/uploads\//, "").replace(/\//g, path.sep);
  const resolved = path.resolve(uploadsRoot, relative);
  if (!resolved.startsWith(uploadsRoot)) return null;
  return resolved;
}

async function listDiskImages() {
  const folder = path.join(getUploadsRoot(), mediaFolder);
  try {
    const entries = await readdir(folder);
    const images = [];
    for (const filename of entries) {
      const contentType = contentTypeFromName(filename);
      if (!contentType) continue;
      const filePath = path.join(folder, filename);
      const info = await stat(filePath);
      if (!info.isFile()) continue;
      images.push({
        name: filename,
        url: `/uploads/${mediaFolder}/${filename}`,
        contentType,
        sizeBytes: info.size,
        createdAt: info.birthtime.toISOString(),
      });
    }
    return images;
  } catch {
    return [];
  }
}

async function reconcileDiskImages() {
  const diskImages = await listDiskImages();
  if (diskImages.length === 0) return;

  await updateStore((store) => {
    let changed = false;
    for (const diskImage of diskImages) {
      if (store.gallery.some((image) => image.url === diskImage.url)) continue;
      store.gallery.push({
        id: nextNumericId(store.gallery),
        name: diskImage.name,
        url: diskImage.url,
        caption: diskImage.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        category: "legacy-upload",
        contentType: diskImage.contentType,
        sizeBytes: diskImage.sizeBytes,
        uploadedByUserId: null,
        uploadedByName: "Existing upload",
        sortOrder: store.gallery.length,
        createdAt: diskImage.createdAt,
        updatedAt: null,
      });
      changed = true;
    }
    return changed;
  });
}

router.get("/list", requireAdmin, async (req, res): Promise<void> => {
  try {
    await reconcileDiskImages();
    const store = await readStore();
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
    const media = [...store.gallery]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((image) => {
        if (!search) return true;
        return [image.name, image.caption, image.category, image.url, image.uploadedByName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .map(toMediaResponse);
    res.json({ media, total: media.length });
  } catch (err) {
    req.log.error({ err }, "Failed to list admin media");
    res.status(500).json({ error: "Failed to list media" });
  }
});

router.post("/upload", requireAdmin, async (req, res): Promise<void> => {
  const filename = typeof req.body?.filename === "string" ? req.body.filename : "";
  const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "";
  const base64Data = typeof req.body?.base64Data === "string" ? req.body.base64Data : "";
  const caption = typeof req.body?.caption === "string" ? req.body.caption.trim() : "";
  const category = typeof req.body?.category === "string" ? req.body.category.trim() : "";

  if (!filename || !contentType || !base64Data) {
    res.status(400).json({ error: "filename, contentType and base64Data are required" });
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    res.status(400).json({ error: "Only JPG, PNG, and WEBP images are supported" });
    return;
  }

  try {
    const url = await saveBase64Image({ filename, contentType, base64Data, folder: mediaFolder });
    const sizeBytes = Buffer.from(base64Data, "base64").length;
    const created = await updateStore((store) => {
      const image: GalleryImageRecord = {
        id: nextNumericId(store.gallery),
        name: filename,
        url,
        caption: caption || null,
        category: category || "admin-media",
        contentType,
        sizeBytes,
        uploadedByUserId: req.authUser?.id ?? null,
        uploadedByName: req.authUser?.name || req.authUser?.email || "Admin",
        sortOrder: store.gallery.length,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };
      store.gallery.push(image);
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "media.uploaded",
          entityType: "media",
          entityId: String(image.id),
          summary: `Uploaded image ${image.name}`,
        }),
      );
      return image;
    });
    res.status(201).json(toMediaResponse(created));
  } catch (err) {
    req.log.error({ err }, "Failed to upload admin media");
    await updateStore((store) => {
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "media.upload.error",
          entityType: "error",
          entityId: "media-upload",
          summary: err instanceof Error ? err.message : "Failed to upload media",
        }),
      );
    });
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to upload media" });
  }
});

router.put("/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid media ID" });
    return;
  }

  try {
    const filename = typeof req.body?.filename === "string" ? req.body.filename : "";
    const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "";
    const base64Data = typeof req.body?.base64Data === "string" ? req.body.base64Data : "";
    if (base64Data && (!filename || !["image/jpeg", "image/png", "image/webp"].includes(contentType))) {
      res.status(400).json({ error: "Replacement image must be JPG, PNG, or WEBP" });
      return;
    }

    const storeBefore = await readStore();
    const previous = storeBefore.gallery.find((entry) => entry.id === id);
    const replacementUrl = base64Data
      ? await saveBase64Image({ filename, contentType, base64Data, folder: mediaFolder })
      : null;
    const replacementSize = base64Data ? Buffer.from(base64Data, "base64").length : null;

    const updated = await updateStore((store) => {
      const image = store.gallery.find((entry) => entry.id === id);
      if (!image) return null;
      if (typeof req.body?.name === "string") image.name = req.body.name.trim() || image.name;
      if (typeof req.body?.url === "string" && req.body.url.trim()) image.url = req.body.url.trim();
      if (replacementUrl) {
        image.name = filename;
        image.url = replacementUrl;
        image.contentType = contentType;
        image.sizeBytes = replacementSize;
      }
      if (typeof req.body?.caption === "string") image.caption = req.body.caption.trim() || null;
      if (typeof req.body?.category === "string") image.category = req.body.category.trim() || null;
      image.updatedAt = new Date().toISOString();
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "media.updated",
          entityType: "media",
          entityId: String(image.id),
          summary: `Updated image ${image.name || image.url}`,
        }),
      );
      return image;
    });
    if (!updated) {
      res.status(404).json({ error: "Media not found" });
      return;
    }
    if (replacementUrl && previous) {
      const oldPath = localPathFromUrl(previous.url);
      if (oldPath) await unlink(oldPath).catch(() => undefined);
    }
    res.json(toMediaResponse(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update admin media");
    res.status(500).json({ error: "Failed to update media" });
  }
});

router.delete("/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid media ID" });
    return;
  }

  try {
    const removed = await updateStore((store) => {
      const image = store.gallery.find((entry) => entry.id === id);
      if (!image) return null;
      store.gallery = store.gallery.filter((entry) => entry.id !== id);
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "media.deleted",
          entityType: "media",
          entityId: String(image.id),
          summary: `Deleted image ${image.name || image.url}`,
        }),
      );
      return image;
    });
    if (!removed) {
      res.status(404).json({ error: "Media not found" });
      return;
    }
    const filePath = localPathFromUrl(removed.url);
    if (filePath) {
      await unlink(filePath).catch(() => undefined);
    }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete admin media");
    res.status(500).json({ error: "Failed to delete media" });
  }
});

export default router;
