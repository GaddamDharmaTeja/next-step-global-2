import { Router } from "express";
import { readStore } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();
const staleMs = 1000 * 60 * 60 * 24 * 3;

router.get("/", requireAdmin, async (_req, res): Promise<void> => {
  const store = await readStore();
  const now = Date.now();
  const reminders = store.inquiries
    .filter((inquiry) => inquiry.status !== "resolved")
    .flatMap((inquiry) => {
      const items = [];
      if (inquiry.followUpAt && new Date(inquiry.followUpAt).getTime() <= now) {
        items.push({ id: `follow-${inquiry.id}`, type: "follow_up", priority: "high", inquiry, message: `Follow-up due for ${inquiry.name}` });
      }
      const lastTouch = new Date(inquiry.lastContactedAt || inquiry.createdAt).getTime();
      if (!inquiry.followUpAt && now - lastTouch >= staleMs) {
        items.push({ id: `stale-${inquiry.id}`, type: "stale_lead", priority: "medium", inquiry, message: `${inquiry.name} has not been contacted recently` });
      }
      return items;
    });
  res.json(reminders);
});

export default router;
