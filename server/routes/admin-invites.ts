import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore, type UserRole } from "../lib/store";
import { normalizeEmail, requireOwner } from "../lib/auth";

const router = Router();

router.get("/", requireOwner, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.adminInvites);
  } catch (err) {
    req.log.error({ err }, "Failed to list admin invites");
    res.status(500).json({ error: "Failed to list admin invites" });
  }
});

router.post("/", requireOwner, async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const role = req.body?.role === "owner" ? "owner" : req.body?.role === "admin" ? "admin" : null;

  if (!email || !email.includes("@") || !role) {
    res.status(400).json({ error: "Valid email and role are required" });
    return;
  }

  try {
    const invite = await updateStore((store) => {
      const existing = store.adminInvites.find((entry) => normalizeEmail(entry.email) === email && entry.status === "pending");
      if (existing) {
        existing.role = role as UserRole;
        return existing;
      }
      const created = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        email,
        role: role as UserRole,
        status: "pending" as const,
        invitedByUserId: req.authUser?.id || null,
        invitedByName: req.authUser?.name || req.authUser?.email || "Owner",
        createdAt: new Date().toISOString(),
        acceptedAt: null,
      };
      store.adminInvites.unshift(created);
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Owner",
          actorRole: req.authUser?.role || "owner",
          action: "admin.invite.created",
          entityType: "admin_invite",
          entityId: created.id,
          summary: `Invited ${email} as ${role}`,
        }),
      );
      return created;
    });
    res.status(201).json(invite);
  } catch (err) {
    req.log.error({ err }, "Failed to create admin invite");
    res.status(500).json({ error: "Failed to create admin invite" });
  }
});

export default router;
