import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore } from "../lib/store";
import { requireAdmin, requireAuth } from "../lib/auth";

const router = Router();

router.get("/mine", requireAuth, async (req, res): Promise<void> => {
  const store = await readStore();
  res.json(store.messages.filter((entry) => entry.studentEmail.toLowerCase() === req.authUser!.email.toLowerCase()));
});

router.post("/mine", requireAuth, async (req, res): Promise<void> => {
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  const inquiryId = req.body?.inquiryId ? Number(req.body.inquiryId) : null;
  if (!body) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  const created = await updateStore((store) => {
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      inquiryId: Number.isFinite(inquiryId) ? inquiryId : null,
      studentEmail: req.authUser!.email,
      studentUserId: req.authUser!.id,
      senderUserId: req.authUser!.id,
      senderName: req.authUser!.name || req.authUser!.email,
      senderRole: req.authUser!.role,
      body,
      createdAt: new Date().toISOString(),
    };
    store.messages.push(message);
    return message;
  });
  res.status(201).json(created);
});

router.get("/", requireAdmin, async (_req, res): Promise<void> => {
  const store = await readStore();
  res.json([...store.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const studentEmail = typeof req.body?.studentEmail === "string" ? req.body.studentEmail.trim().toLowerCase() : "";
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  const inquiryId = req.body?.inquiryId ? Number(req.body.inquiryId) : null;
  if (!studentEmail || !body) {
    res.status(400).json({ error: "Student email and message are required" });
    return;
  }
  const created = await updateStore((store) => {
    const user = store.users.find((entry) => entry.email.toLowerCase() === studentEmail);
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      inquiryId: Number.isFinite(inquiryId) ? inquiryId : null,
      studentEmail,
      studentUserId: user?.id || null,
      senderUserId: req.authUser?.id || null,
      senderName: req.authUser?.name || req.authUser?.email || "Admin",
      senderRole: req.authUser?.role || "admin",
      body,
      createdAt: new Date().toISOString(),
    };
    store.messages.push(message);
    store.auditLogs.unshift(createAuditLogEntry({
      actorUserId: req.authUser?.id,
      actorName: req.authUser?.name || req.authUser?.email || "Admin",
      actorRole: req.authUser?.role || "admin",
      action: "message.sent",
      entityType: "message",
      entityId: message.id,
      summary: `Sent portal message to ${studentEmail}`,
    }));
    return message;
  });
  res.status(201).json(created);
});

export default router;
