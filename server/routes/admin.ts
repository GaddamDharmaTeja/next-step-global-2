import { Router } from "express";
import { readStore } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/stats", requireAdmin, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    const recentInquiries = [...store.inquiries]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    res.json({
      totalUsers: store.users.length,
      totalInquiries: store.inquiries.length,
      pendingInquiries: store.inquiries.filter((entry) => entry.status === "pending").length,
      totalPrograms: store.programs.length,
      totalGalleryImages: store.gallery.length,
      totalTestimonials: store.testimonials.length,
      totalDocuments: store.studentDocuments.length,
      pendingFollowUps: store.inquiries.filter((entry) => Boolean(entry.followUpAt)).length,
      pendingInvites: store.adminInvites.filter((entry) => entry.status === "pending").length,
      recentInquiries,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Failed to get admin stats" });
  }
});

export default router;
