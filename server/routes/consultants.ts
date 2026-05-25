import { Router } from "express";
import { nextNumericId, readStore, updateStore, type ConsultantRecord } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

function cleanStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseBody(body: any, existing?: ConsultantRecord): Omit<ConsultantRecord, "id" | "createdAt"> | null {
  const name = typeof body?.name === "string" ? body.name.trim() : existing?.name ?? "";
  const role = typeof body?.role === "string" ? body.role.trim() : existing?.role ?? "";
  const specialty = typeof body?.specialty === "string" ? body.specialty.trim() : existing?.specialty ?? "";
  const experience = typeof body?.experience === "string" ? body.experience.trim() : existing?.experience ?? "";
  const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : existing?.imageUrl ?? null;
  const bio = typeof body?.bio === "string" ? body.bio.trim() : existing?.bio ?? "";
  const countries = cleanStringArray(body?.countries ?? existing?.countries);
  const languages = cleanStringArray(body?.languages ?? existing?.languages);
  const featured = typeof body?.featured === "boolean" ? body.featured : existing?.featured ?? true;
  const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : existing?.sortOrder ?? 0;

  if (!name || !role || !specialty || !experience || !bio) {
    return null;
  }

  return { name, role, specialty, experience, imageUrl, bio, countries, languages, featured, sortOrder };
}

router.get("/", async (_req, res): Promise<void> => {
  const store = await readStore();
  res.json([...store.consultants].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const parsed = parseBody(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Name, role, specialty, experience and bio are required" });
    return;
  }

  const created = await updateStore((store) => {
    const consultant: ConsultantRecord = {
      id: nextNumericId(store.consultants),
      ...parsed,
      createdAt: new Date().toISOString(),
    };
    store.consultants.push(consultant);
    return consultant;
  });

  res.status(201).json(created);
});

router.patch("/:id", requireAdmin, async (req, res): Promise<void> => {
  const consultantId = Number(req.params.id);
  if (Number.isNaN(consultantId)) {
    res.status(400).json({ error: "Invalid consultant ID" });
    return;
  }

  const updated = await updateStore((store) => {
    const consultant = store.consultants.find((entry) => entry.id === consultantId);
    if (!consultant) {
      return null;
    }
    const parsed = parseBody(req.body, consultant);
    if (!parsed) {
      return "invalid" as const;
    }
    Object.assign(consultant, parsed);
    return consultant;
  });

  if (updated === "invalid") {
    res.status(400).json({ error: "Name, role, specialty, experience and bio are required" });
    return;
  }
  if (!updated) {
    res.status(404).json({ error: "Consultant not found" });
    return;
  }

  res.json(updated);
});

router.delete("/:id", requireAdmin, async (req, res): Promise<void> => {
  const consultantId = Number(req.params.id);
  if (Number.isNaN(consultantId)) {
    res.status(400).json({ error: "Invalid consultant ID" });
    return;
  }

  await updateStore((store) => {
    store.consultants = store.consultants.filter((entry) => entry.id !== consultantId);
  });
  res.status(204).send();
});

export default router;
