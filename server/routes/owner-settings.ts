import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore } from "../lib/store";
import { requireOwner } from "../lib/auth";

const router = Router();

const clearableCollections = new Set([
  "inquiries",
  "programs",
  "gallery",
  "testimonials",
  "destinations",
  "consultants",
  "appointments",
  "auditLogs",
  "adminInvites",
  "notificationTemplates",
  "studentDocuments",
  "messages",
  "chatConversations",
  "chatMessages",
]);

function byteSize(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function getCollectionStats(store: any) {
  return Object.entries(store)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()),
      count: Array.isArray(value) ? value.length : 0,
      bytes: byteSize(value),
      clearable: clearableCollections.has(key),
    }));
}

router.get("/", requireOwner, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.ownerSettings);
  } catch (err) {
    req.log.error({ err }, "Failed to load owner settings");
    res.status(500).json({ error: "Failed to load owner settings" });
  }
});

router.patch("/", requireOwner, async (req, res): Promise<void> => {
  try {
    const updated = await updateStore((store) => {
      store.ownerSettings = {
        ...store.ownerSettings,
        companyName: typeof req.body?.companyName === "string" ? req.body.companyName.trim() : store.ownerSettings.companyName,
        ownerName: typeof req.body?.ownerName === "string" ? req.body.ownerName.trim() : store.ownerSettings.ownerName,
        supportEmail: typeof req.body?.supportEmail === "string" ? req.body.supportEmail.trim() : store.ownerSettings.supportEmail,
        supportPhone: typeof req.body?.supportPhone === "string" ? req.body.supportPhone.trim() : store.ownerSettings.supportPhone,
        timezone: typeof req.body?.timezone === "string" ? req.body.timezone.trim() : store.ownerSettings.timezone,
        defaultCounselorMessage:
          typeof req.body?.defaultCounselorMessage === "string"
            ? req.body.defaultCounselorMessage.trim()
            : store.ownerSettings.defaultCounselorMessage,
        brandTagline: typeof req.body?.brandTagline === "string" ? req.body.brandTagline.trim() : store.ownerSettings.brandTagline,
      };
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Owner",
          actorRole: req.authUser?.role || "owner",
          action: "owner.settings.updated",
          entityType: "owner_settings",
          entityId: "global",
          summary: "Updated owner settings",
        }),
      );
      return store.ownerSettings;
    });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update owner settings");
    res.status(500).json({ error: "Failed to update owner settings" });
  }
});

router.get("/database", requireOwner, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json({
      totalBytes: byteSize(store),
      collections: getCollectionStats(store),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load database stats");
    res.status(500).json({ error: "Failed to load database stats" });
  }
});

router.post("/database/clear", requireOwner, async (req, res): Promise<void> => {
  const collections = Array.isArray(req.body?.collections)
    ? req.body.collections.map(String).filter((key: string) => clearableCollections.has(key))
    : [];

  if (collections.length === 0) {
    res.status(400).json({ error: "Select at least one clearable collection" });
    return;
  }

  try {
    const updated = await updateStore((store: any) => {
      for (const collection of collections) {
        store[collection] = [];
      }
      if (collections.includes("chatConversations")) {
        store.chatMessages = [];
      }
      if (collections.includes("chatMessages")) {
        store.chatConversations = store.chatConversations.map((conversation: any) => ({
          ...conversation,
          updatedAt: conversation.createdAt,
        }));
      }
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Owner",
          actorRole: req.authUser?.role || "owner",
          action: "database.collections.cleared",
          entityType: "database",
          entityId: "app-store",
          summary: `Cleared collections: ${collections.join(", ")}`,
        }),
      );
      return {
        totalBytes: byteSize(store),
        collections: getCollectionStats(store),
        cleared: collections,
        updatedAt: new Date().toISOString(),
      };
    });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to clear database collections");
    res.status(500).json({ error: "Failed to clear database collections" });
  }
});

export default router;
