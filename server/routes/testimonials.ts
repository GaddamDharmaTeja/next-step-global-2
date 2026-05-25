import { Router } from "express";
import {
  CreateTestimonialBody,
  DeleteTestimonialParams,
  UpdateTestimonialBody,
  UpdateTestimonialParams,
} from "@workspace/api-zod";
import { nextNumericId, readStore, updateStore } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.testimonials);
  } catch (err) {
    req.log.error({ err }, "Failed to list testimonials");
    res.status(500).json({ error: "Failed to list testimonials" });
  }
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const result = CreateTestimonialBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  try {
    const created = await updateStore((store) => {
      const testimonial = {
        id: nextNumericId(store.testimonials),
        studentName: result.data.studentName,
        country: result.data.country,
        program: result.data.program ?? null,
        message: result.data.message,
        avatarUrl: result.data.avatarUrl ?? null,
        rating: result.data.rating,
        featured: result.data.featured ?? false,
        createdAt: new Date().toISOString(),
      };
      store.testimonials.push(testimonial);
      return testimonial;
    });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create testimonial");
    res.status(500).json({ error: "Failed to create testimonial" });
  }
});

router.patch("/:testimonialId", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateTestimonialParams.safeParse({ testimonialId: Number(req.params.testimonialId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid testimonial ID" });
    return;
  }
  const body = UpdateTestimonialBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const updated = await updateStore((store) => {
      const testimonial = store.testimonials.find((entry) => entry.id === params.data.testimonialId);
      if (!testimonial) {
        return null;
      }
      if (body.data.studentName !== undefined) testimonial.studentName = body.data.studentName;
      if (body.data.country !== undefined) testimonial.country = body.data.country;
      if (body.data.program !== undefined) testimonial.program = body.data.program;
      if (body.data.message !== undefined) testimonial.message = body.data.message;
      if (body.data.avatarUrl !== undefined) testimonial.avatarUrl = body.data.avatarUrl;
      if (body.data.rating !== undefined) testimonial.rating = body.data.rating;
      if (body.data.featured !== undefined) testimonial.featured = body.data.featured;
      return testimonial;
    });
    if (!updated) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update testimonial");
    res.status(500).json({ error: "Failed to update testimonial" });
  }
});

router.delete("/:testimonialId", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteTestimonialParams.safeParse({ testimonialId: Number(req.params.testimonialId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid testimonial ID" });
    return;
  }
  try {
    await updateStore((store) => {
      store.testimonials = store.testimonials.filter((entry) => entry.id !== params.data.testimonialId);
    });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete testimonial");
    res.status(500).json({ error: "Failed to delete testimonial" });
  }
});

export default router;
