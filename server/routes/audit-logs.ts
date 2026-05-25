import { Router } from "express";
import { readStore } from "../lib/store";
import { requireOwner } from "../lib/auth";

const router = Router();

router.get("/", requireOwner, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.auditLogs.slice(0, 200));
  } catch (err) {
    req.log.error({ err }, "Failed to list audit logs");
    res.status(500).json({ error: "Failed to list audit logs" });
  }
});

export default router;
