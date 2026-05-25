import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore } from "../lib/store";
import { requireAdmin, requireAuth } from "../lib/auth";
import { saveBase64Document } from "../lib/uploads";

const router = Router();

router.get("/mine", requireAuth, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.studentDocuments.filter((entry) => entry.userId === req.authUser!.id));
  } catch (err) {
    req.log.error({ err }, "Failed to list student documents");
    res.status(500).json({ error: "Failed to list student documents" });
  }
});

router.get("/", requireAdmin, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.studentDocuments);
  } catch (err) {
    req.log.error({ err }, "Failed to list all student documents");
    res.status(500).json({ error: "Failed to list student documents" });
  }
});

router.post("/mine", requireAuth, async (req, res): Promise<void> => {
  const filename = typeof req.body?.filename === "string" ? req.body.filename.trim() : "";
  const contentType = typeof req.body?.contentType === "string" ? req.body.contentType.trim() : "";
  const base64Data = typeof req.body?.base64Data === "string" ? req.body.base64Data.trim() : "";

  if (!filename || !contentType || !base64Data) {
    res.status(400).json({ error: "Document file data is required" });
    return;
  }

  try {
    const saved = await saveBase64Document({
      filename,
      contentType,
      base64Data,
      folder: "documents",
    });
    const created = await updateStore((store) => {
      const document = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: req.authUser!.id,
        userEmail: req.authUser!.email,
        userName: req.authUser!.name,
        fileName: filename,
        fileUrl: saved.url,
        contentType,
        sizeBytes: saved.sizeBytes,
        status: "uploaded" as const,
        note: null,
        uploadedAt: new Date().toISOString(),
      };
      store.studentDocuments.unshift(document);
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Student",
          actorRole: req.authUser?.role || "user",
          action: "student.document.uploaded",
          entityType: "student_document",
          entityId: document.id,
          summary: `Uploaded document ${document.fileName}`,
        }),
      );
      return document;
    });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to upload student document");
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to upload student document" });
  }
});

router.patch("/:documentId", requireAdmin, async (req, res): Promise<void> => {
  try {
    const updated = await updateStore((store) => {
      const document = store.studentDocuments.find((entry) => entry.id === req.params.documentId);
      if (!document) return null;
      if (typeof req.body?.status === "string" && ["uploaded", "reviewing", "approved", "rejected"].includes(req.body.status)) {
        document.status = req.body.status;
      }
      if (typeof req.body?.note === "string") {
        document.note = req.body.note.trim() || null;
      }
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "student.document.reviewed",
          entityType: "student_document",
          entityId: document.id,
          summary: `Updated document ${document.fileName} to ${document.status}`,
        }),
      );
      return document;
    });
    if (!updated) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update student document");
    res.status(500).json({ error: "Failed to update student document" });
  }
});

export default router;
