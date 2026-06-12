import { Router } from "express";
import { createAuditLogEntry, nextNumericId, readStore, updateStore, type ProgramLevel, type ScholarshipRecord } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();
const levels = new Set<ProgramLevel>(["undergraduate", "postgraduate", "research", "diploma", "any"]);

function parseBody(body: any, existing?: ScholarshipRecord): Omit<ScholarshipRecord, "id" | "createdAt"> | null {
  const name = typeof body?.name === "string" ? body.name.trim() : existing?.name || "";
  const country = typeof body?.country === "string" ? body.country.trim() : existing?.country || "";
  const programLevel = levels.has(body?.programLevel) ? body.programLevel : existing?.programLevel || "any";
  const eligibility = typeof body?.eligibility === "string" ? body.eligibility.trim() : existing?.eligibility || "";
  const awardValue = typeof body?.awardValue === "string" ? body.awardValue.trim() : existing?.awardValue || "";
  const deadline = typeof body?.deadline === "string" ? body.deadline.trim() : existing?.deadline || "";
  const intake = typeof body?.intake === "string" && body.intake.trim() ? body.intake.trim() : existing?.intake || null;
  const applicationLink = typeof body?.applicationLink === "string" && body.applicationLink.trim() ? body.applicationLink.trim() : existing?.applicationLink || null;
  const active = typeof body?.active === "boolean" ? body.active : existing?.active ?? true;

  if (!name || !country || !eligibility || !awardValue || !deadline) return null;
  return { name, country, programLevel, eligibility, awardValue, deadline, intake, applicationLink, active };
}

router.get("/", async (req, res): Promise<void> => {
  const store = await readStore();
  const country = typeof req.query.country === "string" ? req.query.country.toLowerCase() : "";
  const level = typeof req.query.level === "string" ? req.query.level.toLowerCase() : "";
  const q = typeof req.query.q === "string" ? req.query.q.toLowerCase() : "";
  res.json(
    store.scholarships.filter((entry) => {
      if (!entry.active && !req.authUser) return false;
      if (country && !entry.country.toLowerCase().includes(country)) return false;
      if (level && entry.programLevel !== "any" && entry.programLevel !== level) return false;
      if (q && !`${entry.name} ${entry.country} ${entry.eligibility} ${entry.awardValue}`.toLowerCase().includes(q)) return false;
      return true;
    }),
  );
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const payload = parseBody(req.body);
  if (!payload) {
    res.status(400).json({ error: "Name, country, eligibility, award value, and deadline are required" });
    return;
  }
  const created = await updateStore((store) => {
    const record = { id: nextNumericId(store.scholarships), ...payload, createdAt: new Date().toISOString() };
    store.scholarships.unshift(record);
    store.auditLogs.unshift(createAuditLogEntry({
      actorUserId: req.authUser?.id,
      actorName: req.authUser?.name || req.authUser?.email || "Admin",
      actorRole: req.authUser?.role || "admin",
      action: "scholarship.created",
      entityType: "scholarship",
      entityId: String(record.id),
      summary: `Created scholarship ${record.name}`,
    }));
    return record;
  });
  res.status(201).json(created);
});

router.patch("/:scholarshipId", requireAdmin, async (req, res): Promise<void> => {
  const scholarshipId = Number(req.params.scholarshipId);
  const updated = await updateStore((store) => {
    const existing = store.scholarships.find((entry) => entry.id === scholarshipId);
    if (!existing) return null;
    const payload = parseBody(req.body, existing);
    if (!payload) return null;
    Object.assign(existing, payload);
    return existing;
  });
  if (!updated) {
    res.status(404).json({ error: "Scholarship not found or invalid payload" });
    return;
  }
  res.json(updated);
});

router.delete("/:scholarshipId", requireAdmin, async (req, res): Promise<void> => {
  const scholarshipId = Number(req.params.scholarshipId);
  await updateStore((store) => {
    store.scholarships = store.scholarships.filter((entry) => entry.id !== scholarshipId);
  });
  res.status(204).send();
});

export default router;
