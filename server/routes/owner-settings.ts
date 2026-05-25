import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore } from "../lib/store";
import { requireOwner } from "../lib/auth";

const router = Router();

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

export default router;
