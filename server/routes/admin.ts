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
    const now = Date.now();
    const activeInquiries = store.inquiries.filter((entry) => entry.status !== "resolved");
    const overdueFollowUps = activeInquiries.filter((entry) => entry.followUpAt && new Date(entry.followUpAt).getTime() <= now).length;
    const staleLeads = activeInquiries.filter((entry) => !entry.followUpAt && now - new Date(entry.lastContactedAt || entry.createdAt).getTime() >= 1000 * 60 * 60 * 24 * 3).length;
    const stageCounts = store.inquiries.reduce<Record<string, number>>((acc, entry) => {
      const stage = entry.leadStage || "new";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    const appointmentStatusCounts = store.appointments.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {});
    const approvedDocuments = store.studentDocuments.filter((entry) => entry.status === "approved").length;
    const counselorWorkload = store.users
      .filter((user) => user.role === "admin" || user.role === "manager" || user.role === "owner")
      .map((user) => ({
        userId: user.id,
        name: user.name || user.email,
        inquiries: store.inquiries.filter((entry) => entry.assignedToUserId === user.id).length,
        appointments: store.appointments.filter((entry) => entry.assignedToUserId === user.id).length,
        documents: store.studentDocuments.filter((entry) => entry.assignedToUserId === user.id).length,
      }));

    res.json({
      totalUsers: store.users.length,
      totalInquiries: store.inquiries.length,
      pendingInquiries: store.inquiries.filter((entry) => entry.status === "pending").length,
      totalPrograms: store.programs.length,
      totalGalleryImages: store.gallery.length,
      totalTestimonials: store.testimonials.length,
      totalDocuments: store.studentDocuments.length,
      totalScholarships: store.scholarships.length,
      totalMessages: store.messages.length + store.chatMessages.length,
      totalAppointments: store.appointments.length,
      pendingFollowUps: store.inquiries.filter((entry) => Boolean(entry.followUpAt)).length,
      overdueFollowUps,
      staleLeads,
      pendingInvites: store.adminInvites.filter((entry) => entry.status === "pending").length,
      conversionRate: store.inquiries.length ? Math.round((store.inquiries.filter((entry) => entry.leadStage === "enrolled").length / store.inquiries.length) * 100) : 0,
      documentApprovalRate: store.studentDocuments.length ? Math.round((approvedDocuments / store.studentDocuments.length) * 100) : 0,
      stageCounts,
      appointmentStatusCounts,
      counselorWorkload,
      recentInquiries,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Failed to get admin stats" });
  }
});

export default router;
