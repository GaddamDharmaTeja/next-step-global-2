import { Router } from "express";
import {
  CreateInquiryBody,
  DeleteInquiryParams,
  GetInquiryParams,
  UpdateInquiryBody,
  UpdateInquiryParams,
} from "@workspace/api-zod";
import { calculateVisaReadinessScore, createAuditLogEntry, nextNumericId, readStore, updateStore, type LeadStage, type ProgramLevel } from "../lib/store";
import { requireAdmin, requireAuth } from "../lib/auth";

const router = Router();

function calculateLeadScore(input: {
  subject: string;
  message: string;
  phone?: string | null;
  whatsapp?: string | null;
  followUpAt?: string | null;
  leadStage?: LeadStage;
}): number {
  const text = `${input.subject} ${input.message}`.toLowerCase();
  let score = 20;
  if (input.phone) score += 15;
  if (input.whatsapp) score += 10;
  if (/(visa|urgent|asap|september|january|may|intake|scholarship|ielts|pte|budget)/.test(text)) score += 25;
  if (input.message.length > 120) score += 15;
  if (input.followUpAt && new Date(input.followUpAt).getTime() <= Date.now() + 1000 * 60 * 60 * 24 * 7) score += 10;
  if (input.leadStage && ["counseling", "documents", "applied", "offer", "visa"].includes(input.leadStage)) score += 15;
  return Math.min(100, score);
}

function inferProgramLevel(text: string): ProgramLevel | null {
  const normalized = text.toLowerCase();
  if (/(phd|doctorate|research)/.test(normalized)) return "research";
  if (/(masters|master|mba|msc|ms|postgraduate)/.test(normalized)) return "postgraduate";
  if (/(bachelor|undergraduate|bsc|ba|bba)/.test(normalized)) return "undergraduate";
  if (/(diploma|certificate)/.test(normalized)) return "diploma";
  return null;
}

router.get("/", requireAdmin, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.inquiries);
  } catch (err) {
    req.log.error({ err }, "Failed to list inquiries");
    res.status(500).json({ error: "Failed to list inquiries" });
  }
});

router.get("/mine", requireAuth, async (req, res): Promise<void> => {
  try {
    const store = await readStore();
    res.json(store.inquiries.filter((entry) => entry.email.toLowerCase() === req.authUser!.email.toLowerCase()));
  } catch (err) {
    req.log.error({ err }, "Failed to list current user inquiries");
    res.status(500).json({ error: "Failed to list inquiries" });
  }
});

router.post("/", async (req, res): Promise<void> => {
  const result = CreateInquiryBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  try {
    const created = await updateStore((store) => {
      const inquiry = {
        id: nextNumericId(store.inquiries),
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone ?? null,
        whatsapp: result.data.whatsapp ?? null,
        subject: result.data.subject,
        message: result.data.message,
        status: "pending" as const,
        leadStage: "new" as const,
        assignedToUserId: null,
        assignedToName: null,
        followUpAt: null,
        notes: null,
        leadScore: calculateLeadScore(result.data),
        destination: store.destinations.find((destination) =>
          `${result.data.subject} ${result.data.message}`.toLowerCase().includes(destination.name.toLowerCase()),
        )?.name || null,
        programLevel: inferProgramLevel(`${result.data.subject} ${result.data.message}`),
        intake: null,
        lastContactedAt: null,
        visaReadinessScore: 10,
        createdAt: new Date().toISOString(),
      };
      store.inquiries.push(inquiry);
      return inquiry;
    });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create inquiry");
    res.status(500).json({ error: "Failed to create inquiry" });
  }
});

router.get("/:inquiryId", async (req, res): Promise<void> => {
  const params = GetInquiryParams.safeParse({ inquiryId: Number(req.params.inquiryId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid inquiry ID" });
    return;
  }
  try {
    const store = await readStore();
    const inquiry = store.inquiries.find((entry) => entry.id === params.data.inquiryId);
    if (!inquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }
    res.json(inquiry);
  } catch (err) {
    req.log.error({ err }, "Failed to get inquiry");
    res.status(500).json({ error: "Failed to get inquiry" });
  }
});

router.patch("/:inquiryId/lead", requireAdmin, async (req, res): Promise<void> => {
  const inquiryId = Number(req.params.inquiryId);
  const leadStages = new Set<LeadStage>(["new", "contacted", "counseling", "documents", "applied", "offer", "visa", "enrolled", "lost"]);
  const leadStage = typeof req.body?.leadStage === "string" ? req.body.leadStage : "";
  const notes = typeof req.body?.notes === "string" ? req.body.notes : undefined;
  const followUpAt = typeof req.body?.followUpAt === "string" && req.body.followUpAt.trim() ? req.body.followUpAt.trim() : null;
  const assignedToUserId = typeof req.body?.assignedToUserId === "string" && req.body.assignedToUserId.trim() ? req.body.assignedToUserId.trim() : null;
  const destination = typeof req.body?.destination === "string" ? req.body.destination.trim() : undefined;
  const programLevel = typeof req.body?.programLevel === "string" ? req.body.programLevel.trim() : undefined;
  const intake = typeof req.body?.intake === "string" ? req.body.intake.trim() : undefined;

  if (Number.isNaN(inquiryId) || !leadStages.has(leadStage as LeadStage)) {
    res.status(400).json({ error: "Invalid inquiry or lead stage" });
    return;
  }

  const updated = await updateStore((store) => {
    const inquiry = store.inquiries.find((entry) => entry.id === inquiryId);
    if (!inquiry) return null;
    inquiry.leadStage = leadStage as LeadStage;
    inquiry.followUpAt = followUpAt;
    if (notes !== undefined) inquiry.notes = notes || null;
    if (destination !== undefined) inquiry.destination = destination || null;
    if (programLevel !== undefined) inquiry.programLevel = (programLevel || null) as ProgramLevel | null;
    if (intake !== undefined) inquiry.intake = intake || null;
    if (assignedToUserId !== undefined) {
      const assignee = assignedToUserId ? store.users.find((entry) => entry.id === assignedToUserId && (entry.role === "admin" || entry.role === "manager" || entry.role === "owner")) : null;
      inquiry.assignedToUserId = assignee?.id || null;
      inquiry.assignedToName = assignee?.name || assignee?.email || null;
    }
    if (leadStage === "contacted") inquiry.status = "contacted";
    if (leadStage === "contacted") inquiry.lastContactedAt = new Date().toISOString();
    if (leadStage === "enrolled") inquiry.status = "resolved";
    if (leadStage === "lost") inquiry.status = "resolved";
    inquiry.leadScore = calculateLeadScore(inquiry);
    inquiry.visaReadinessScore = calculateVisaReadinessScore(inquiry, store.studentDocuments);
    store.auditLogs.unshift(
      createAuditLogEntry({
        actorUserId: req.authUser?.id,
        actorName: req.authUser?.name || req.authUser?.email || "Admin",
        actorRole: req.authUser?.role || "admin",
        action: "lead.updated",
        entityType: "inquiry",
        entityId: String(inquiry.id),
        summary: `Moved inquiry ${inquiry.id} to ${inquiry.leadStage}${inquiry.assignedToName ? ` and assigned to ${inquiry.assignedToName}` : ""}`,
      }),
    );
    return inquiry;
  });

  if (!updated) {
    res.status(404).json({ error: "Inquiry not found" });
    return;
  }

  res.json(updated);
});

router.patch("/:inquiryId", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateInquiryParams.safeParse({ inquiryId: Number(req.params.inquiryId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid inquiry ID" });
    return;
  }
  const body = UpdateInquiryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const updated = await updateStore((store) => {
      const inquiry = store.inquiries.find((entry) => entry.id === params.data.inquiryId);
      if (!inquiry) {
        return null;
      }
      if (body.data.status !== undefined) inquiry.status = body.data.status;
      if (body.data.notes !== undefined) inquiry.notes = body.data.notes;
      return inquiry;
    });
    if (!updated) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update inquiry");
    res.status(500).json({ error: "Failed to update inquiry" });
  }
});

router.delete("/:inquiryId", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteInquiryParams.safeParse({ inquiryId: Number(req.params.inquiryId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid inquiry ID" });
    return;
  }
  try {
    await updateStore((store) => {
      store.inquiries = store.inquiries.filter((entry) => entry.id !== params.data.inquiryId);
    });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete inquiry");
    res.status(500).json({ error: "Failed to delete inquiry" });
  }
});

export default router;
