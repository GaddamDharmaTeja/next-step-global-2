import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";

const router = Router();
const uploadsRoot = path.resolve(process.cwd(), "uploads");

function resolveLegacyUpload(requestPath: string) {
  const relativePath = requestPath.replace(/^\/+/, "");
  const resolved = path.resolve(uploadsRoot, relativePath);
  if (resolved !== uploadsRoot && !resolved.startsWith(`${uploadsRoot}${path.sep}`)) {
    return null;
  }
  return resolved;
}

router.get(/^\/.+/, async (req, res): Promise<void> => {
  const filePath = resolveLegacyUpload(req.path);
  if (!filePath) {
    res.status(400).json({ error: "Invalid upload path" });
    return;
  }

  try {
    const file = await stat(filePath);
    if (!file.isFile()) {
      res.status(404).json({ error: "Legacy upload not found" });
      return;
    }

    res.type(path.extname(filePath));
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Length", String(file.size));
    createReadStream(filePath).pipe(res);
  } catch (err) {
    req.log.warn({ err, path: req.path }, "Legacy upload not found");
    res.status(404).json({ error: "Legacy upload not found" });
  }
});

export default router;
