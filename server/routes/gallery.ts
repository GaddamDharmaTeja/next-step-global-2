import { Router } from "express";
import {
  CreateGalleryImageBody,
  DeleteGalleryImageParams,
  UpdateGalleryImageBody,
  UpdateGalleryImageParams,
} from "@workspace/api-zod";
import { nextNumericId, readStore, updateStore } from "../lib/store";
import { requireAdmin } from "../lib/auth";
import { saveBase64Image } from "../lib/uploads";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json([...store.gallery].sort((a, b) => a.sortOrder - b.sortOrder));
  } catch (err) {
    req.log.error({ err }, "Failed to list gallery images");
    res.status(500).json({ error: "Failed to list gallery images" });
  }
});

router.post("/upload", requireAdmin, async (req, res): Promise<void> => {
  const filename = typeof req.body?.filename === "string" ? req.body.filename : "";
  const contentType = typeof req.body?.contentType === "string" ? req.body.contentType : "";
  const base64Data = typeof req.body?.base64Data === "string" ? req.body.base64Data : "";
  const caption = typeof req.body?.caption === "string" ? req.body.caption : null;
  const category = typeof req.body?.category === "string" ? req.body.category : null;
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
  if (Number.isNaN(sortOrder)) {
    res.status(400).json({ error: "sortOrder must be a number" });
    return;
  }

  try {
    const url = await saveBase64Image({ filename, contentType, base64Data, folder: "gallery" });
    const created = await updateStore((store) => {
      const image = {
        id: nextNumericId(store.gallery),
        url,
        caption,
        category,
        sortOrder,
        createdAt: new Date().toISOString(),
      };
      store.gallery.push(image);
      return image;
    });

    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to upload gallery image");
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
      const image = {
        id: nextNumericId(store.gallery),
        url: result.data.url,
        caption: result.data.caption ?? null,
        category: result.data.category ?? null,
        sortOrder: result.data.sortOrder ?? 0,
        createdAt: new Date().toISOString(),
      };
      store.gallery.push(image);
      return image;
    });
    res.status(201).json(created);
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
    const updated = await updateStore((store) => {
      const image = store.gallery.find((entry) => entry.id === params.data.imageId);
      if (!image) {
        return null;
      }
      if (body.data.url !== undefined) image.url = body.data.url;
      if (body.data.caption !== undefined) image.caption = body.data.caption;
      if (body.data.category !== undefined) image.category = body.data.category;
      if (body.data.sortOrder !== undefined) image.sortOrder = body.data.sortOrder;
      return image;
    });
    if (!updated) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update gallery image");
    res.status(500).json({ error: "Failed to update gallery image" });
  }
});

router.delete("/:imageId", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteGalleryImageParams.safeParse({ imageId: Number(req.params.imageId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }
  try {
    await updateStore((store) => {
      store.gallery = store.gallery.filter((entry) => entry.id !== params.data.imageId);
    });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete gallery image");
    res.status(500).json({ error: "Failed to delete gallery image" });
  }
});

export default router;
