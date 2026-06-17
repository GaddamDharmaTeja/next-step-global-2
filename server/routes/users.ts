import { Router } from "express";
import { UpdateUserRoleBody, UpdateUserRoleParams } from "@workspace/api-zod";
import { createAuditLogEntry, isMongoAuthError, readStore, updateStore, type UserRole } from "../lib/store";
import {
  clearSessionCookie,
  createUserId,
  hashPassword,
  normalizeEmail,
  requireAdmin,
  requireAuth,
  requireOwner,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from "../lib/auth";

const router = Router();

router.post("/signup", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters long" });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    const created = await updateStore((store) => {
      const existingUser = store.users.find((entry) => normalizeEmail(entry.email) === email);
      if (existingUser?.passwordHash) {
        return { error: "An account with this email already exists" } as const;
      }

      const realUsers = store.users.filter((entry) => entry.passwordHash);
      const matchingInvite = store.adminInvites.find(
        (entry) => entry.status === "pending" && normalizeEmail(entry.email) === email,
      );
      const role: UserRole = matchingInvite ? matchingInvite.role : realUsers.length === 0 ? "owner" : "user";
      const nextUsers = store.users.filter((entry) => entry.passwordHash || entry.clerkId !== "local-admin");
      const user = {
        id: createUserId(),
        clerkId: `local-${createUserId()}`,
        email,
        name: name || null,
        phone: phone || null,
        role,
        positionId: null,
        positionName: null,
        reportsToUserId: null,
        reportsToName: null,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      nextUsers.push(user);
      store.users = nextUsers;
      if (matchingInvite) {
        matchingInvite.status = "accepted";
        matchingInvite.acceptedAt = new Date().toISOString();
      }
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: user.id,
          actorName: user.name || user.email,
          actorRole: user.role,
          action: "user.signup",
          entityType: "user",
          entityId: user.id,
          summary: `Created account with ${user.role} access`,
        }),
      );
      return { user } as const;
    });

    if ("error" in created) {
      res.status(409).json({ error: created.error });
      return;
    }

    setSessionCookie(res, created.user);
    res.status(201).json(toPublicUser(created.user));
  } catch (err) {
    req.log.error({ err }, "Failed to sign up user");
    if (isMongoAuthError(err)) {
      res.status(503).json({ error: "MongoDB authentication failed. Check MONGODB_URI username/password." });
      return;
    }
    res.status(500).json({ error: "Failed to create account" });
  }
});

router.post("/login", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const store = await readStore();
    const user = store.users.find((entry) => normalizeEmail(entry.email) === email);
    const isValid = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    setSessionCookie(res, user);
    res.json(toPublicUser(user));
  } catch (err) {
    req.log.error({ err }, "Failed to log in user");
    if (isMongoAuthError(err)) {
      res.status(503).json({ error: "MongoDB authentication failed. Check MONGODB_URI username/password." });
      return;
    }
    res.status(500).json({ error: "Failed to log in" });
  }
});

router.post("/logout", (req, res): void => {
  clearSessionCookie(res);
  res.status(204).send();
});

router.post("/reset-password", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters long" });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    const updated = await updateStore((store) => {
      const user = store.users.find((entry) => normalizeEmail(entry.email) === email && entry.passwordHash);
      if (!user) return null;
      user.passwordHash = passwordHash;
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: user.id,
          actorName: user.name || user.email,
          actorRole: user.role,
          action: "user.password.reset",
          entityType: "user",
          entityId: user.id,
          summary: `Password reset for ${user.email}`,
        }),
      );
      return user;
    });

    if (!updated) {
      res.status(404).json({ error: "No account found with that email" });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to reset password");
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  res.json(toPublicUser(req.authUser!));
});

router.get("/", requireAdmin, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.users.filter((entry) => entry.passwordHash).map(toPublicUser));
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.patch("/:userId/role", requireOwner, async (req, res): Promise<void> => {
  const paramsResult = UpdateUserRoleParams.safeParse({ userId: req.params.userId });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const bodyResult = UpdateUserRoleBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: bodyResult.error.message });
    return;
  }
  try {
    if (req.authUser && paramsResult.data.userId === req.authUser.id && bodyResult.data.role !== "owner") {
      res.status(400).json({ error: "Owners cannot remove their own owner access" });
      return;
    }

    const updated = await updateStore((store) => {
      const user = store.users.find(
        (entry) => entry.id === paramsResult.data.userId || entry.clerkId === paramsResult.data.userId,
      );
      if (!user || !user.passwordHash) {
        return null;
      }
      user.role = bodyResult.data.role;
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Owner",
          actorRole: req.authUser?.role || "owner",
          action: "user.role.updated",
          entityType: "user",
          entityId: user.id,
          summary: `Changed ${user.email} role to ${user.role}`,
        }),
      );
      return user;
    });
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(toPublicUser(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update user role");
    res.status(500).json({ error: "Failed to update user role" });
  }
});

router.patch("/:userId/profile", requireOwner, async (req, res): Promise<void> => {
  const userId = req.params.userId;
  const positionId = typeof req.body?.positionId === "string" ? req.body.positionId.trim() : undefined;
  const reportsToUserId = typeof req.body?.reportsToUserId === "string" ? req.body.reportsToUserId.trim() : undefined;

  try {
    const updated = await updateStore((store) => {
      const user = store.users.find((entry) => entry.id === userId || entry.clerkId === userId);
      if (!user || !user.passwordHash) return null;
      if (user.role === "admin" || user.role === "manager" || user.role === "owner") return "protected-role" as const;

      if (positionId !== undefined) {
        const position = store.userPositions.find((entry) => entry.id === positionId);
        user.positionId = position?.id ?? null;
        user.positionName = position?.name ?? null;
      }

      if (reportsToUserId !== undefined) {
        const manager = store.users.find((entry) => entry.id === reportsToUserId && entry.passwordHash);
        user.reportsToUserId = manager?.id ?? null;
        user.reportsToName = manager ? manager.name || manager.email : null;
      }

      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Owner",
          actorRole: req.authUser?.role || "owner",
          action: "user.profile.updated",
          entityType: "user",
          entityId: user.id,
          summary: `Updated ${user.email} position/reporting details`,
        }),
      );
      return user;
    });

    if (updated === "protected-role") {
      res.status(400).json({ error: "Positions and reporting managers can only be assigned to normal users" });
      return;
    }
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(toPublicUser(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update user profile");
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

router.delete("/:userId", requireOwner, async (req, res): Promise<void> => {
  const userId = req.params.userId;

  if (req.authUser && req.authUser.id === userId) {
    res.status(400).json({ error: "Owners cannot delete their own account" });
    return;
  }

  try {
    const removed = await updateStore((store) => {
      const user = store.users.find((entry) => entry.id === userId || entry.clerkId === userId);
      if (!user || !user.passwordHash) {
        return null;
      }

      const activeOwners = store.users.filter((entry) => entry.passwordHash && entry.role === "owner");
      if (user.role === "owner" && activeOwners.length <= 1) {
        return "last-owner" as const;
      }

      const userEmail = normalizeEmail(user.email);
      const deletedInquiries = store.inquiries.filter((entry) => normalizeEmail(entry.email) === userEmail).length;
      const deletedAppointments = store.appointments.filter((entry) => normalizeEmail(entry.email) === userEmail).length;
      const deletedDocuments = store.studentDocuments.filter((entry) => entry.userId === user.id || normalizeEmail(entry.userEmail) === userEmail).length;
      const deletedMessages = store.messages.filter(
        (entry) =>
          entry.studentUserId === user.id ||
          entry.senderUserId === user.id ||
          normalizeEmail(entry.studentEmail) === userEmail,
      ).length;
      const deletedChatMessages = store.chatMessages.filter((entry) => entry.senderUserId === user.id).length;
      const affectedChatConversations = store.chatConversations.filter((entry) => entry.memberUserIds.includes(user.id)).length;

      store.users = store.users.filter((entry) => entry.id !== user.id);
      store.inquiries = store.inquiries
        .filter((entry) => normalizeEmail(entry.email) !== userEmail)
        .map((entry) =>
          entry.assignedToUserId === user.id
            ? { ...entry, assignedToUserId: null, assignedToName: null }
            : entry,
        );
      store.appointments = store.appointments
        .filter((entry) => normalizeEmail(entry.email) !== userEmail)
        .map((entry) =>
          entry.assignedToUserId === user.id
            ? { ...entry, assignedToUserId: null, assignedToName: null }
            : entry,
        );
      store.studentDocuments = store.studentDocuments
        .filter((entry) => entry.userId !== user.id && normalizeEmail(entry.userEmail) !== userEmail)
        .map((entry) =>
          entry.assignedToUserId === user.id
            ? { ...entry, assignedToUserId: null, assignedToName: null }
            : entry,
        );
      store.messages = store.messages.filter(
        (entry) =>
          entry.studentUserId !== user.id &&
          entry.senderUserId !== user.id &&
          normalizeEmail(entry.studentEmail) !== userEmail,
      );
      store.chatMessages = store.chatMessages.filter((entry) => entry.senderUserId !== user.id);
      store.chatConversations = store.chatConversations
        .map((entry) => ({
          ...entry,
          memberUserIds: entry.memberUserIds.filter((memberUserId) => memberUserId !== user.id),
        }))
        .filter((entry) => entry.memberUserIds.length > 0);
      store.adminInvites = store.adminInvites.filter((entry) => normalizeEmail(entry.email) !== userEmail);
      store.auditLogs = store.auditLogs.filter(
        (entry) => entry.actorUserId !== user.id && !(entry.entityType === "user" && entry.entityId === user.id),
      );
      store.auditLogs.unshift(
        createAuditLogEntry({
          actorUserId: req.authUser?.id,
          actorName: req.authUser?.name || req.authUser?.email || "Owner",
          actorRole: req.authUser?.role || "owner",
          action: "user.deleted",
          entityType: "user",
          entityId: user.id,
          summary: `Deleted user ${user.email} and removed related data: ${deletedInquiries} inquiries, ${deletedAppointments} appointments, ${deletedDocuments} documents, ${deletedMessages} inquiry messages, ${deletedChatMessages} chat messages, ${affectedChatConversations} chat memberships`,
        }),
      );
      return user;
    });

    if (removed === "last-owner") {
      res.status(400).json({ error: "At least one owner account is required" });
      return;
    }
    if (!removed) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
