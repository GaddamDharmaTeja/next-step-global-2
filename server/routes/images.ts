import { Router } from "express";
import { ObjectId } from "mongodb";
import { findGridFsFile, openGridFsDownloadStream } from "../lib/gridfs";

const router = Router();

router.get("/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }

  try {
    const objectId = new ObjectId(id);
    const file = await findGridFsFile(objectId);
    if (!file) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    if (file.contentType) {
      res.type(file.contentType);
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", String(file.length));

    const stream = await openGridFsDownloadStream(objectId);
    stream.on("error", (error) => {
      req.log.error({ err: error, imageId: id }, "Failed to stream GridFS image");
      if (!res.headersSent) {
        res.status(404).json({ error: "Image not found" });
      } else {
        res.destroy(error);
      }
    });
    stream.pipe(res);
  } catch (err) {
    req.log.error({ err, imageId: id }, "Failed to load GridFS image");
    res.status(500).json({ error: "Failed to load image" });
  }
});

export default router;
