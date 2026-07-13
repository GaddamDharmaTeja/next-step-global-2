import { Router } from "express";
import { createAuditLogEntry, readStore, updateStore, type SiteContentRecord } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanMetrics(value: unknown, fallback: SiteContentRecord["metrics"]) {
  if (!Array.isArray(value)) return fallback;
  const metrics = value
    .map((entry) => ({
      value: cleanString(entry?.value),
      label: cleanString(entry?.label),
    }))
    .filter((entry) => entry.value && entry.label);
  return metrics.length ? metrics : fallback;
}

function cleanServices(value: unknown, fallback: SiteContentRecord["services"]) {
  if (!Array.isArray(value)) return fallback;
  const services = value
    .map((entry) => ({
      title: cleanString(entry?.title),
      text: cleanString(entry?.text),
    }))
    .filter((entry) => entry.title && entry.text);
  return services.length ? services : fallback;
}

function cleanFaqs(value: unknown, fallback: SiteContentRecord["faqs"]) {
  if (!Array.isArray(value)) return fallback;
  const faqs = value
    .map((entry) => ({
      question: cleanString(entry?.question),
      answer: cleanString(entry?.answer),
    }))
    .filter((entry) => entry.question && entry.answer);
  return faqs.length ? faqs : fallback;
}

function cleanIntakeTimeline(value: unknown, fallback: SiteContentRecord["intakeTimeline"]) {
  if (!Array.isArray(value)) return fallback;
  const intakes = value
    .map((entry) => ({
      intake: cleanString(entry?.intake),
      deadline: cleanString(entry?.deadline),
      description: cleanString(entry?.description),
    }))
    .filter((entry) => entry.intake && entry.deadline && entry.description);
  return intakes.length ? intakes : fallback;
}

function cleanStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((entry) => cleanString(entry))
    .filter(Boolean);
  return items.length ? items : fallback;
}

router.get("/", async (_req, res): Promise<void> => {
  const store = await readStore();
  res.json(store.siteContent);
});

router.patch("/", requireAdmin, async (req, res): Promise<void> => {
  const updated = await updateStore((store) => {
    store.siteContent = {
      heroTitle: cleanString(req.body?.heroTitle, store.siteContent.heroTitle),
      heroAccent: cleanString(req.body?.heroAccent, store.siteContent.heroAccent),
      heroSubtitle: cleanString(req.body?.heroSubtitle, store.siteContent.heroSubtitle),
      primaryCta: cleanString(req.body?.primaryCta, store.siteContent.primaryCta),
      secondaryCta: cleanString(req.body?.secondaryCta, store.siteContent.secondaryCta),
      metrics: cleanMetrics(req.body?.metrics, store.siteContent.metrics),
      mentorshipTitle: cleanString(req.body?.mentorshipTitle, store.siteContent.mentorshipTitle),
      mentorshipSubtitle: cleanString(req.body?.mentorshipSubtitle, store.siteContent.mentorshipSubtitle),
      services: cleanServices(req.body?.services, store.siteContent.services),
      faqs: cleanFaqs(req.body?.faqs, store.siteContent.faqs),
      intakeTimeline: cleanIntakeTimeline(req.body?.intakeTimeline, store.siteContent.intakeTimeline),
      aboutTitle: cleanString(req.body?.aboutTitle, store.siteContent.aboutTitle),
      aboutText: cleanString(req.body?.aboutText, store.siteContent.aboutText),
      aboutHighlights: cleanStringList(req.body?.aboutHighlights, store.siteContent.aboutHighlights),
      contactTitle: cleanString(req.body?.contactTitle, store.siteContent.contactTitle),
      contactText: cleanString(req.body?.contactText, store.siteContent.contactText),
      contactEmail: cleanString(req.body?.contactEmail, store.siteContent.contactEmail),
      contactPhone: cleanString(req.body?.contactPhone, store.siteContent.contactPhone),
      footerTagline: cleanString(req.body?.footerTagline, store.siteContent.footerTagline),
    };
    store.auditLogs.unshift(
      createAuditLogEntry({
        actorUserId: req.authUser?.id,
        actorName: req.authUser?.name || req.authUser?.email || "Admin",
        actorRole: req.authUser?.role || "admin",
        action: "content.updated",
        entityType: "content",
        entityId: "site-content",
        summary: "Updated landing page site content",
      }),
    );
    return store.siteContent;
  });

  res.json(updated);
});

export default router;
