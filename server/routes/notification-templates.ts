import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore, type NotificationChannel } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/", requireAdmin, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.notificationTemplates);
  } catch (err) {
    req.log.error({ err }, "Failed to list notification templates");
    res.status(500).json({ error: "Failed to list notification templates" });
  }
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const purpose = typeof req.body?.purpose === "string" ? req.body.purpose.trim() : "general";
  const channel = typeof req.body?.channel === "string" ? req.body.channel : "";
  if (!name || !subject || !message || !["email", "whatsapp", "both"].includes(channel)) {
    res.status(400).json({ error: "Name, subject, message, and channel are required" });
    return;
  }

  try {
    const created = await updateStore((store) => {
      const template = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        subject,
        message,
        purpose,
        channel: channel as NotificationChannel,
        updatedAt: new Date().toISOString(),
      };
      store.notificationTemplates.unshift(template);
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "notification.template.created",
          entityType: "notification_template",
          entityId: template.id,
          summary: `Created notification template ${template.name}`,
        }),
      );
      return template;
    });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create notification template");
    res.status(500).json({ error: "Failed to create notification template" });
  }
});

router.patch("/:templateId", requireAdmin, async (req, res): Promise<void> => {
  try {
    const updated = await updateStore((store) => {
      const template = store.notificationTemplates.find((entry) => entry.id === req.params.templateId);
      if (!template) return null;
      if (typeof req.body?.name === "string") template.name = req.body.name.trim();
      if (typeof req.body?.subject === "string") template.subject = req.body.subject.trim();
      if (typeof req.body?.message === "string") template.message = req.body.message.trim();
      if (typeof req.body?.purpose === "string") template.purpose = req.body.purpose.trim();
      if (typeof req.body?.channel === "string" && ["email", "whatsapp", "both"].includes(req.body.channel)) {
        template.channel = req.body.channel as NotificationChannel;
      }
      template.updatedAt = new Date().toISOString();
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Admin",
          actorRole: req.authUser?.role || "admin",
          action: "notification.template.updated",
          entityType: "notification_template",
          entityId: template.id,
          summary: `Updated notification template ${template.name}`,
        }),
      );
      return template;
    });
    if (!updated) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update notification template");
    res.status(500).json({ error: "Failed to update notification template" });
  }
});

export default router;
