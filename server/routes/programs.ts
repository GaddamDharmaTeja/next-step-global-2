import { Router } from "express";
import {
  CreateProgramBody,
  DeleteProgramParams,
  GetProgramParams,
  UpdateProgramBody,
  UpdateProgramParams,
} from "@workspace/api-zod";
import { nextNumericId, readStore, updateStore } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item).trim()).filter(Boolean);
}

router.get("/", async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.programs);
  } catch (err) {
    req.log.error({ err }, "Failed to list programs");
    res.status(500).json({ error: "Failed to list programs" });
  }
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const result = CreateProgramBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  try {
    const created = await updateStore((store) => {
      const program = {
        id: nextNumericId(store.programs),
        title: result.data.title,
        description: result.data.description,
        country: result.data.country,
        duration: result.data.duration,
        imageUrl: result.data.imageUrl ?? null,
        tuitionFee: result.data.tuitionFee ?? null,
        intakeMonths: cleanStringArray(result.data.intakeMonths),
        eligibility: result.data.eligibility ?? null,
        englishRequirement: result.data.englishRequirement ?? null,
        applicationDeadline: result.data.applicationDeadline ?? null,
        scholarshipAvailable: result.data.scholarshipAvailable ?? false,
        careerOutcomes: cleanStringArray(result.data.careerOutcomes),
        featured: result.data.featured ?? false,
        createdAt: new Date().toISOString(),
      };
      store.programs.push(program);
      return program;
    });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create program");
    res.status(500).json({ error: "Failed to create program" });
  }
});

router.get("/:programId", async (req, res): Promise<void> => {
  const params = GetProgramParams.safeParse({ programId: Number(req.params.programId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid program ID" });
    return;
  }
  try {
    const store = await readStore();
    const program = store.programs.find((entry) => entry.id === params.data.programId);
    if (!program) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    res.json(program);
  } catch (err) {
    req.log.error({ err }, "Failed to get program");
    res.status(500).json({ error: "Failed to get program" });
  }
});

router.patch("/:programId", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProgramParams.safeParse({ programId: Number(req.params.programId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid program ID" });
    return;
  }
  const body = UpdateProgramBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const updated = await updateStore((store) => {
      const program = store.programs.find((entry) => entry.id === params.data.programId);
      if (!program) {
        return null;
      }
      if (body.data.title !== undefined) program.title = body.data.title;
      if (body.data.description !== undefined) program.description = body.data.description;
      if (body.data.country !== undefined) program.country = body.data.country;
      if (body.data.duration !== undefined) program.duration = body.data.duration;
      if (body.data.imageUrl !== undefined) program.imageUrl = body.data.imageUrl;
      if (body.data.tuitionFee !== undefined) program.tuitionFee = body.data.tuitionFee || null;
      if (body.data.intakeMonths !== undefined) program.intakeMonths = cleanStringArray(body.data.intakeMonths);
      if (body.data.eligibility !== undefined) program.eligibility = body.data.eligibility || null;
      if (body.data.englishRequirement !== undefined) program.englishRequirement = body.data.englishRequirement || null;
      if (body.data.applicationDeadline !== undefined) program.applicationDeadline = body.data.applicationDeadline || null;
      if (body.data.scholarshipAvailable !== undefined) program.scholarshipAvailable = body.data.scholarshipAvailable;
      if (body.data.careerOutcomes !== undefined) program.careerOutcomes = cleanStringArray(body.data.careerOutcomes);
      if (body.data.featured !== undefined) program.featured = body.data.featured;
      return program;
    });
    if (!updated) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update program");
    res.status(500).json({ error: "Failed to update program" });
  }
});

router.delete("/:programId", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProgramParams.safeParse({ programId: Number(req.params.programId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid program ID" });
    return;
  }
  try {
    await updateStore((store) => {
      store.programs = store.programs.filter((entry) => entry.id !== params.data.programId);
    });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete program");
    res.status(500).json({ error: "Failed to delete program" });
  }
});

export default router;
