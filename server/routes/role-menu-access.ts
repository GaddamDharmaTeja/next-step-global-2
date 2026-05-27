import { Router } from "express";
import { readStore, updateStore } from "../lib/store";
import { requireAdmin, requireOwner } from "../lib/auth";

const router = Router();

const allowedMenuIds = new Set([
  "dashboard",
  "content",
  "inquiries",
  "pipeline",
  "appointments",
  "consultants",
  "programs",
  "countries",
  "gallery",
  "testimonials",
  "users",
  "roles",
  "notifications",
  "templates",
  "documents",
  "settings",
  "auditLogs",
]);

const allowedUserPortalIds = new Set(["hero", "profile", "inquiries", "programs", "documents"]);

function cleanMenuIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter((item) => allowedMenuIds.has(item));
}

function cleanUserPortalIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter((item) => allowedUserPortalIds.has(item));
}

router.get("/", requireAdmin, async (_req, res): Promise<void> => {
  const store = await readStore();
  res.json(store.roleMenuAccess);
});

router.patch("/", requireOwner, async (req, res): Promise<void> => {
  const admin = cleanMenuIds(req.body?.admin);
  const userPortal = cleanUserPortalIds(req.body?.userPortal);
  const updated = await updateStore((store) => {
    store.roleMenuAccess = {
      admin,
      userPortal,
    };
    return store.roleMenuAccess;
  });
  res.json(updated);
});

export default router;
