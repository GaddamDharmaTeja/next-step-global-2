import { Router } from "express";
import { nextNumericId, readStore, updateStore, type DocumentChecklistItemRecord, type DocumentChecklistTemplateRecord, type ProgramLevel } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();
const levels = new Set<ProgramLevel>(["undergraduate", "postgraduate", "research", "diploma", "any"]);

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseItems(value: unknown): DocumentChecklistItemRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      const label = typeof item?.label === "string" ? item.label.trim() : "";
      if (!label) return null;
      return { id: typeof item?.id === "string" && item.id.trim() ? item.id.trim() : `${slug(label)}-${index + 1}`, label, required: item?.required !== false };
    })
    .filter(Boolean) as DocumentChecklistItemRecord[];
}

function parseBody(body: any, existing?: DocumentChecklistTemplateRecord): Omit<DocumentChecklistTemplateRecord, "id" | "createdAt"> | null {
  const destination = typeof body?.destination === "string" ? body.destination.trim() : existing?.destination || "";
  const programLevel = levels.has(body?.programLevel) ? body.programLevel : existing?.programLevel || "any";
  const title = typeof body?.title === "string" ? body.title.trim() : existing?.title || "";
  const items = body?.items !== undefined ? parseItems(body.items) : existing?.items || [];
  if (!destination || !title || items.length === 0) return null;
  return { destination, programLevel, title, items };
}

router.get("/", async (req, res): Promise<void> => {
  const store = await readStore();
  const destination = typeof req.query.destination === "string" ? req.query.destination.toLowerCase() : "";
  const level = typeof req.query.level === "string" ? req.query.level.toLowerCase() : "";
  res.json(store.documentChecklistTemplates.filter((entry) => {
    if (destination && entry.destination.toLowerCase() !== destination && entry.destination.toLowerCase() !== "default") return false;
    if (level && entry.programLevel !== "any" && entry.programLevel !== level) return false;
    return true;
  }));
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const payload = parseBody(req.body);
  if (!payload) {
    res.status(400).json({ error: "Destination, title, and at least one checklist item are required" });
    return;
  }
  const created = await updateStore((store) => {
    const record = { id: nextNumericId(store.documentChecklistTemplates), ...payload, createdAt: new Date().toISOString() };
    store.documentChecklistTemplates.unshift(record);
    return record;
  });
  res.status(201).json(created);
});

router.patch("/:templateId", requireAdmin, async (req, res): Promise<void> => {
  const templateId = Number(req.params.templateId);
  const updated = await updateStore((store) => {
    const existing = store.documentChecklistTemplates.find((entry) => entry.id === templateId);
    if (!existing) return null;
    const payload = parseBody(req.body, existing);
    if (!payload) return null;
    Object.assign(existing, payload);
    return existing;
  });
  if (!updated) {
    res.status(404).json({ error: "Checklist template not found or invalid payload" });
    return;
  }
  res.json(updated);
});

router.delete("/:templateId", requireAdmin, async (req, res): Promise<void> => {
  const templateId = Number(req.params.templateId);
  await updateStore((store) => {
    store.documentChecklistTemplates = store.documentChecklistTemplates.filter((entry) => entry.id !== templateId);
  });
  res.status(204).send();
});

export default router;
