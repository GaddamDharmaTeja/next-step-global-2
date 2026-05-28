import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore } from "../lib/store";
import { requireOwner } from "../lib/auth";

const router = Router();

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `position-${Date.now()}`;
}

router.get("/", requireOwner, async (_req, res): Promise<void> => {
  const store = await readStore();
  res.json([...store.userPositions].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)));
});

router.post("/", requireOwner, async (req, res): Promise<void> => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const level = Number(req.body?.level || 1);
  const description = typeof req.body?.description === "string" && req.body.description.trim() ? req.body.description.trim() : null;
  const reportsToPositionId = typeof req.body?.reportsToPositionId === "string" && req.body.reportsToPositionId.trim() ? req.body.reportsToPositionId.trim() : null;

  if (!name) {
    res.status(400).json({ error: "Position name is required" });
    return;
  }

  const created = await updateStore((store) => {
    const baseId = slugify(name);
    let id = baseId;
    let index = 2;
    while (store.userPositions.some((position) => position.id === id)) {
      id = `${baseId}-${index++}`;
    }
    const position = {
      id,
      name,
      level: Number.isFinite(level) ? level : 1,
      description,
      reportsToPositionId,
      createdAt: new Date().toISOString(),
    };
    store.userPositions.push(position);
    store.auditLogs.unshift(
      createAuditLogEntry({
        actorUserId: req.authUser?.id,
        actorName: req.authUser?.name || req.authUser?.email || "Owner",
        actorRole: req.authUser?.role || "owner",
        action: "user.position.created",
        entityType: "user_position",
        entityId: position.id,
        summary: `Created position ${position.name}`,
      }),
    );
    return position;
  });
  res.status(201).json(created);
});

router.patch("/:positionId", requireOwner, async (req, res): Promise<void> => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined;
  const level = req.body?.level !== undefined ? Number(req.body.level) : undefined;
  const description = typeof req.body?.description === "string" ? req.body.description.trim() || null : undefined;
  const reportsToPositionId = typeof req.body?.reportsToPositionId === "string" ? req.body.reportsToPositionId.trim() || null : undefined;

  const updated = await updateStore((store) => {
    const position = store.userPositions.find((entry) => entry.id === req.params.positionId);
    if (!position) return null;
    if (name !== undefined && name) position.name = name;
    if (level !== undefined && Number.isFinite(level)) position.level = level;
    if (description !== undefined) position.description = description;
    if (reportsToPositionId !== undefined) position.reportsToPositionId = reportsToPositionId === position.id ? null : reportsToPositionId;

    for (const user of store.users) {
      if (user.positionId === position.id) {
        user.positionName = position.name;
      }
    }
    return position;
  });

  if (!updated) {
    res.status(404).json({ error: "Position not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:positionId", requireOwner, async (req, res): Promise<void> => {
  await updateStore((store) => {
    store.userPositions = store.userPositions.filter((entry) => entry.id !== req.params.positionId);
    for (const position of store.userPositions) {
      if (position.reportsToPositionId === req.params.positionId) position.reportsToPositionId = null;
    }
    for (const user of store.users) {
      if (user.positionId === req.params.positionId) {
        user.positionId = null;
        user.positionName = null;
      }
    }
  });
  res.status(204).send();
});

export default router;
