import { Router } from "express";
import { nextNumericId, readStore, updateStore, type DestinationRecord } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseBody(body: any, existing?: DestinationRecord): Omit<DestinationRecord, "id" | "createdAt"> | null {
  const name = typeof body?.name === "string" ? body.name.trim() : existing?.name ?? "";
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : existing?.code ?? "";
  const slugSource = typeof body?.slug === "string" && body.slug.trim() ? body.slug : name;
  const slug = slugify(slugSource);
  const description = typeof body?.description === "string" ? body.description.trim() : existing?.description ?? "";
  const overview = typeof body?.overview === "string" ? body.overview.trim() : existing?.overview ?? "";
  const tuition = typeof body?.tuition === "string" ? body.tuition.trim() : existing?.tuition ?? "";
  const accent = typeof body?.accent === "string" && body.accent.trim() ? body.accent.trim() : existing?.accent ?? "from-blue-50 to-slate-50";
  const featured = typeof body?.featured === "boolean" ? body.featured : existing?.featured ?? true;
  const highlights = cleanStringArray(body?.highlights ?? existing?.highlights);
  const universities = cleanStringArray(body?.universities ?? existing?.universities);
  const requirements = cleanStringArray(body?.requirements ?? existing?.requirements);
  const workOptions = cleanStringArray(body?.workOptions ?? existing?.workOptions);

  if (!name || !code || !slug || !description || !overview || !tuition) {
    return null;
  }

  return { slug, code, name, description, overview, highlights, universities, tuition, requirements, workOptions, accent, featured };
}

router.get("/", async (_req, res): Promise<void> => {
  const store = await readStore();
  res.json(store.destinations);
});

router.get("/:slug", async (req, res): Promise<void> => {
  const store = await readStore();
  const destination = store.destinations.find((entry) => entry.slug === req.params.slug);
  if (!destination) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }
  res.json(destination);
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const parsed = parseBody(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Name, code, description, overview and tuition are required" });
    return;
  }

  const created = await updateStore((store) => {
    if (store.destinations.some((entry) => entry.slug === parsed.slug)) {
      return null;
    }
    const destination: DestinationRecord = {
      id: nextNumericId(store.destinations),
      ...parsed,
      createdAt: new Date().toISOString(),
    };
    store.destinations.push(destination);
    return destination;
  });

  if (!created) {
    res.status(409).json({ error: "A destination with this slug already exists" });
    return;
  }

  res.status(201).json(created);
});

router.patch("/:id", requireAdmin, async (req, res): Promise<void> => {
  const destinationId = Number(req.params.id);
  if (Number.isNaN(destinationId)) {
    res.status(400).json({ error: "Invalid destination ID" });
    return;
  }

  const updated = await updateStore((store) => {
    const destination = store.destinations.find((entry) => entry.id === destinationId);
    if (!destination) {
      return null;
    }
    const parsed = parseBody(req.body, destination);
    if (!parsed) {
      return "invalid" as const;
    }
    const duplicate = store.destinations.find((entry) => entry.id !== destinationId && entry.slug === parsed.slug);
    if (duplicate) {
      return "duplicate" as const;
    }
    Object.assign(destination, parsed);
    return destination;
  });

  if (updated === "invalid") {
    res.status(400).json({ error: "Name, code, description, overview and tuition are required" });
    return;
  }
  if (updated === "duplicate") {
    res.status(409).json({ error: "A destination with this slug already exists" });
    return;
  }
  if (!updated) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }

  res.json(updated);
});

router.delete("/:id", requireAdmin, async (req, res): Promise<void> => {
  const destinationId = Number(req.params.id);
  if (Number.isNaN(destinationId)) {
    res.status(400).json({ error: "Invalid destination ID" });
    return;
  }

  await updateStore((store) => {
    store.destinations = store.destinations.filter((entry) => entry.id !== destinationId);
  });
  res.status(204).send();
});

export default router;
