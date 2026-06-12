import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore, type ChatConversationRecord, type ChatMessageRecord, type UserRecord } from "../lib/store";
import { requireAuth } from "../lib/auth";

const router = Router();

function publicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function canAccessConversation(user: UserRecord, conversation: ChatConversationRecord) {
  return user.role === "admin" || user.role === "owner" || conversation.memberUserIds.includes(user.id);
}

function conversationPayload(store: Awaited<ReturnType<typeof readStore>>, conversation: ChatConversationRecord) {
  const members = conversation.memberUserIds
    .map((userId) => store.users.find((user) => user.id === userId))
    .filter((user): user is UserRecord => Boolean(user))
    .map(publicUser);
  const messages = store.chatMessages
    .filter((message) => message.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const lastMessage = messages[messages.length - 1] || null;

  return {
    ...conversation,
    members,
    messages,
    lastMessage,
  };
}

function uniqueUserIds(ids: unknown[]) {
  return Array.from(new Set(ids.map(String).map((id) => id.trim()).filter(Boolean)));
}

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const store = await readStore();
  res.json(store.users.filter((user) => user.id !== req.authUser!.id).map(publicUser));
});

router.get("/conversations", requireAuth, async (req, res): Promise<void> => {
  const store = await readStore();
  const conversations = store.chatConversations
    .filter((conversation) => canAccessConversation(req.authUser!, conversation))
    .map((conversation) => conversationPayload(store, conversation))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  res.json(conversations);
});

router.post("/conversations", requireAuth, async (req, res): Promise<void> => {
  const type = req.body?.type === "group" ? "group" : "direct";
  const requestedMemberIds = uniqueUserIds(Array.isArray(req.body?.memberUserIds) ? req.body.memberUserIds : []);
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";

  if (type === "group" && req.authUser!.role !== "owner") {
    res.status(403).json({ error: "Only owners can create chat groups" });
    return;
  }
  if (type === "direct" && requestedMemberIds.length !== 1) {
    res.status(400).json({ error: "Choose exactly one user for a direct chat" });
    return;
  }
  if (type === "group" && requestedMemberIds.length < 1) {
    res.status(400).json({ error: "Choose at least one group member" });
    return;
  }

  const created = await updateStore((store) => {
    const validMemberIds = requestedMemberIds.filter((userId) => store.users.some((user) => user.id === userId));
    if (validMemberIds.length !== requestedMemberIds.length) return { error: "One or more selected users do not exist" } as const;

    const memberUserIds = uniqueUserIds([req.authUser!.id, ...validMemberIds]);
    if (type === "direct") {
      const direct = store.chatConversations.find(
        (conversation) =>
          conversation.type === "direct" &&
          conversation.memberUserIds.length === 2 &&
          memberUserIds.every((userId) => conversation.memberUserIds.includes(userId)),
      );
      if (direct) return { conversation: conversationPayload(store, direct) } as const;
    }

    const now = new Date().toISOString();
    const otherMember = store.users.find((user) => user.id === validMemberIds[0]);
    const conversation: ChatConversationRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      type,
      title: type === "group" ? title || "New Group" : otherMember?.name || otherMember?.email || "Direct chat",
      createdByUserId: req.authUser!.id,
      createdByName: req.authUser!.name || req.authUser!.email,
      memberUserIds,
      createdAt: now,
      updatedAt: now,
    };
    store.chatConversations.push(conversation);
    store.auditLogs.unshift(
      createAuditLogEntry({
        actorUserId: req.authUser!.id,
        actorName: req.authUser!.name || req.authUser!.email,
        actorRole: req.authUser!.role,
        action: type === "group" ? "chat.group.created" : "chat.direct.created",
        entityType: "chat_conversation",
        entityId: conversation.id,
        summary: `${type === "group" ? "Created group" : "Started direct chat"} ${conversation.title}`,
      }),
    );
    return { conversation: conversationPayload(store, conversation) } as const;
  });

  if ("error" in created) {
    res.status(400).json({ error: created.error });
    return;
  }

  res.status(201).json(created.conversation);
});

router.post("/conversations/:conversationId/messages", requireAuth, async (req, res): Promise<void> => {
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!body) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const created = await updateStore((store) => {
    const conversation = store.chatConversations.find((entry) => entry.id === req.params.conversationId);
    if (!conversation) return { error: "Conversation not found", status: 404 } as const;
    if (!canAccessConversation(req.authUser!, conversation)) return { error: "Chat access denied", status: 403 } as const;

    const now = new Date().toISOString();
    const message: ChatMessageRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      conversationId: conversation.id,
      senderUserId: req.authUser!.id,
      senderName: req.authUser!.name || req.authUser!.email,
      senderRole: req.authUser!.role,
      body,
      createdAt: now,
    };
    store.chatMessages.push(message);
    conversation.updatedAt = now;
    return { message } as const;
  });

  if ("error" in created) {
    res.status(created.status ?? 400).json({ error: created.error });
    return;
  }

  res.status(201).json(created.message);
});

router.delete("/conversations/:conversationId", requireAuth, async (req, res): Promise<void> => {
  if (req.authUser!.role !== "owner") {
    res.status(403).json({ error: "Owner access required" });
    return;
  }

  const deleted = await updateStore((store) => {
    const conversation = store.chatConversations.find((entry) => entry.id === req.params.conversationId);
    if (!conversation) return false;
    store.chatConversations = store.chatConversations.filter((entry) => entry.id !== conversation.id);
    store.chatMessages = store.chatMessages.filter((entry) => entry.conversationId !== conversation.id);
    store.auditLogs.unshift(
      createAuditLogEntry({
        actorUserId: req.authUser!.id,
        actorName: req.authUser!.name || req.authUser!.email,
        actorRole: req.authUser!.role,
        action: "chat.conversation.deleted",
        entityType: "chat_conversation",
        entityId: conversation.id,
        summary: `Deleted chat ${conversation.title}`,
      }),
    );
    return true;
  });

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.status(204).send();
});

export default router;
