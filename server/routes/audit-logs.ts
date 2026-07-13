import { Router } from "express";
import { readStore } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/", requireAdmin, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
    const type = typeof req.query.type === "string" ? req.query.type.trim().toLowerCase() : "";
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(10, Number(req.query.pageSize) || 25));
    const filtered = store.auditLogs.filter((entry) => {
      if (type && entry.entityType.toLowerCase() !== type && !entry.action.toLowerCase().includes(type)) return false;
      if (!search) return true;
      return [entry.id, entry.actorName, entry.action, entry.entityType, entry.entityId, entry.summary]
        .some((value) => String(value).toLowerCase().includes(search));
    });
    const start = (page - 1) * pageSize;
    const logs = filtered.slice(start, start + pageSize).map((entry) => ({
      ...entry,
      user: entry.actorName,
      module: entry.entityType,
      timestamp: entry.createdAt,
      details: entry.summary,
    }));
    res.json({
      logs,
      total: filtered.length,
      page,
      pageSize,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list audit logs");
    res.status(500).json({ error: "Failed to list audit logs" });
  }
});

export default router;
