import { Router } from "express";
import {
  createAuditLogEntry,
  readStore,
  updateStore,
  type CmsPageRecord,
  type CmsPageStatus,
} from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanBool(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function cleanNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => cleanString(entry)).filter(Boolean);
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSlug(value: unknown, fallback = "new-page") {
  const slug = cleanString(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function cleanStatus(value: unknown, fallback: CmsPageStatus = "draft"): CmsPageStatus {
  return value === "published" || value === "draft" ? value : fallback;
}

function cleanPagePayload(value: unknown, existing?: CmsPageRecord): CmsPageRecord {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const title = cleanString(source.title, existing?.title || "New Page");
  const slug = normalizeSlug(source.slug, existing?.slug || title);
  const now = new Date().toISOString();

  return {
    id: existing?.id || makeId("cms"),
    title,
    slug,
    url: cleanString(source.url, slug === "home" ? "/" : `/${slug}`),
    seo: {
      metaTitle: cleanString((source.seo as Record<string, unknown> | undefined)?.metaTitle, existing?.seo?.metaTitle || title),
      metaDescription: cleanString((source.seo as Record<string, unknown> | undefined)?.metaDescription, existing?.seo?.metaDescription || ""),
      metaKeywords: cleanString((source.seo as Record<string, unknown> | undefined)?.metaKeywords, existing?.seo?.metaKeywords || ""),
      seoImage: cleanString((source.seo as Record<string, unknown> | undefined)?.seoImage, existing?.seo?.seoImage || "") || null,
    },
    hero: {
      title: cleanString((source.hero as Record<string, unknown> | undefined)?.title, existing?.hero?.title || title),
      subtitle: cleanString((source.hero as Record<string, unknown> | undefined)?.subtitle, existing?.hero?.subtitle || ""),
      description: cleanString((source.hero as Record<string, unknown> | undefined)?.description, existing?.hero?.description || ""),
      backgroundImage: cleanString((source.hero as Record<string, unknown> | undefined)?.backgroundImage, existing?.hero?.backgroundImage || "") || null,
      backgroundVideo: cleanString((source.hero as Record<string, unknown> | undefined)?.backgroundVideo, existing?.hero?.backgroundVideo || "") || null,
      primaryButtonText: cleanString((source.hero as Record<string, unknown> | undefined)?.primaryButtonText, existing?.hero?.primaryButtonText || "Ask an Advisor"),
      primaryButtonLink: cleanString((source.hero as Record<string, unknown> | undefined)?.primaryButtonLink, existing?.hero?.primaryButtonLink || "/contact"),
      secondaryButtonText: cleanString((source.hero as Record<string, unknown> | undefined)?.secondaryButtonText, existing?.hero?.secondaryButtonText || "Explore Programs"),
      secondaryButtonLink: cleanString((source.hero as Record<string, unknown> | undefined)?.secondaryButtonLink, existing?.hero?.secondaryButtonLink || "/programs"),
      visible: cleanBool((source.hero as Record<string, unknown> | undefined)?.visible, existing?.hero?.visible ?? true),
    },
    sections: Array.isArray(source.sections) ? source.sections.map((entry, index) => {
      const section = entry as Record<string, unknown>;
      return {
        id: cleanString(section.id, makeId("section")),
        title: cleanString(section.title),
        subtitle: cleanString(section.subtitle),
        richText: cleanString(section.richText),
        images: cleanStringArray(section.images),
        videos: cleanStringArray(section.videos),
        icons: cleanStringArray(section.icons),
        buttonText: cleanString(section.buttonText),
        buttonLink: cleanString(section.buttonLink),
        backgroundColor: cleanString(section.backgroundColor, "#ffffff"),
        order: cleanNumber(section.order, index + 1),
        enabled: cleanBool(section.enabled, true),
      };
    }) : existing?.sections || [],
    cards: Array.isArray(source.cards) ? source.cards.map((entry, index) => {
      const card = entry as Record<string, unknown>;
      return {
        id: cleanString(card.id, makeId("card")),
        image: cleanString(card.image) || null,
        icon: cleanString(card.icon, "Globe"),
        title: cleanString(card.title),
        description: cleanString(card.description),
        link: cleanString(card.link, "/contact"),
        order: cleanNumber(card.order, index + 1),
        active: cleanBool(card.active, true),
      };
    }) : existing?.cards || [],
    faqs: Array.isArray(source.faqs) ? source.faqs.map((entry, index) => {
      const faq = entry as Record<string, unknown>;
      return {
        id: cleanString(faq.id, makeId("faq")),
        question: cleanString(faq.question),
        answer: cleanString(faq.answer),
        order: cleanNumber(faq.order, index + 1),
      };
    }) : existing?.faqs || [],
    testimonials: Array.isArray(source.testimonials) ? source.testimonials.map((entry) => {
      const testimonial = entry as Record<string, unknown>;
      return {
        id: cleanString(testimonial.id, makeId("testimonial")),
        clientName: cleanString(testimonial.clientName),
        designation: cleanString(testimonial.designation),
        review: cleanString(testimonial.review),
        rating: Math.min(5, Math.max(1, cleanNumber(testimonial.rating, 5))),
        photo: cleanString(testimonial.photo) || null,
      };
    }) : existing?.testimonials || [],
    gallery: Array.isArray(source.gallery) ? source.gallery.map((entry, index) => {
      const item = entry as Record<string, unknown>;
      return {
        id: cleanString(item.id, makeId("gallery")),
        image: cleanString(item.image),
        caption: cleanString(item.caption),
        order: cleanNumber(item.order, index + 1),
      };
    }).filter((item) => item.image) : existing?.gallery || [],
    cta: {
      heading: cleanString((source.cta as Record<string, unknown> | undefined)?.heading, existing?.cta?.heading || ""),
      description: cleanString((source.cta as Record<string, unknown> | undefined)?.description, existing?.cta?.description || ""),
      buttonText: cleanString((source.cta as Record<string, unknown> | undefined)?.buttonText, existing?.cta?.buttonText || "Talk to Advisor"),
      buttonLink: cleanString((source.cta as Record<string, unknown> | undefined)?.buttonLink, existing?.cta?.buttonLink || "/contact"),
      backgroundColor: cleanString((source.cta as Record<string, unknown> | undefined)?.backgroundColor, existing?.cta?.backgroundColor || "#07162f"),
    },
    footerText: cleanString(source.footerText, existing?.footerText || ""),
    status: cleanStatus(source.status, existing?.status || "draft"),
    scheduledPublishAt: cleanString(source.scheduledPublishAt, existing?.scheduledPublishAt || "") || null,
    visible: cleanBool(source.visible, existing?.visible ?? true),
    versionHistory: existing?.versionHistory || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

router.get("/", async (req, res): Promise<void> => {
  const store = await readStore();
  const includeDrafts = req.query.includeDrafts === "true";
  const pages = [...store.cmsPages]
    .filter((page) => includeDrafts || (page.status === "published" && page.visible))
    .sort((a, b) => a.title.localeCompare(b.title));
  res.json(pages);
});

router.get("/:slug", async (req, res): Promise<void> => {
  const store = await readStore();
  const includeDrafts = req.query.includeDrafts === "true";
  const slug = normalizeSlug(req.params.slug);
  const page = store.cmsPages.find((entry) => entry.slug === slug || entry.id === req.params.slug);
  if (!page || (!includeDrafts && (page.status !== "published" || !page.visible))) {
    res.status(404).json({ error: "CMS page not found" });
    return;
  }
  res.json(page);
});

router.post("/", requireAdmin, async (req, res): Promise<void> => {
  const created = await updateStore((store) => {
    const page = cleanPagePayload(req.body);
    if (store.cmsPages.some((entry) => entry.slug === page.slug)) {
      throw new Error("A page with this slug already exists");
    }
    store.cmsPages.push(page);
    store.auditLogs.unshift(createAuditLogEntry({
      actorUserId: req.authUser?.id,
      actorName: req.authUser?.name || req.authUser?.email || "Admin",
      actorRole: req.authUser?.role || "admin",
      action: "cms.page.created",
      entityType: "cms-page",
      entityId: page.id,
      summary: `Created CMS page ${page.title}`,
    }));
    return page;
  });
  res.status(201).json(created);
});

router.put("/:id", requireAdmin, async (req, res): Promise<void> => {
  const updated = await updateStore((store) => {
    const existing = store.cmsPages.find((entry) => entry.id === req.params.id || entry.slug === req.params.id);
    if (!existing) throw new Error("CMS page not found");
    const page = cleanPagePayload(req.body, existing);
    if (store.cmsPages.some((entry) => entry.id !== existing.id && entry.slug === page.slug)) {
      throw new Error("A page with this slug already exists");
    }
    page.versionHistory = [
      {
        id: makeId("version"),
        savedAt: new Date().toISOString(),
        savedBy: req.authUser?.name || req.authUser?.email || "Admin",
        status: page.status,
        title: page.title,
      },
      ...(existing.versionHistory || []),
    ].slice(0, 25);
    store.cmsPages = store.cmsPages.map((entry) => entry.id === existing.id ? page : entry);
    store.auditLogs.unshift(createAuditLogEntry({
      actorUserId: req.authUser?.id,
      actorName: req.authUser?.name || req.authUser?.email || "Admin",
      actorRole: req.authUser?.role || "admin",
      action: page.status === "published" ? "cms.page.published" : "cms.page.saved",
      entityType: "cms-page",
      entityId: page.id,
      summary: `Saved CMS page ${page.title}`,
    }));
    return page;
  });
  res.json(updated);
});

router.post("/:id/sections", requireAdmin, async (req, res): Promise<void> => {
  const created = await updateStore((store) => {
    const existing = store.cmsPages.find((entry) => entry.id === req.params.id || entry.slug === req.params.id);
    if (!existing) throw new Error("CMS page not found");

    const page = cleanPagePayload(
      {
        ...existing,
        sections: [
          ...existing.sections,
          {
            id: makeId("section"),
            order: existing.sections.length + 1,
            enabled: true,
            backgroundColor: "#ffffff",
            ...req.body,
          },
        ],
      },
      existing,
    );
    const section = page.sections[page.sections.length - 1];
    page.versionHistory = existing.versionHistory || [];
    store.cmsPages = store.cmsPages.map((entry) => entry.id === existing.id ? page : entry);
    store.auditLogs.unshift(createAuditLogEntry({
      actorUserId: req.authUser?.id,
      actorName: req.authUser?.name || req.authUser?.email || "Admin",
      actorRole: req.authUser?.role || "admin",
      action: "cms.section.created",
      entityType: "cms-section",
      entityId: section.id,
      summary: `Created section ${section.title || section.id} on ${page.title}`,
    }));
    return section;
  });
  res.status(201).json(created);
});

router.put("/:id/sections/:sectionId", requireAdmin, async (req, res): Promise<void> => {
  const updated = await updateStore((store) => {
    const sectionId = String(req.params.sectionId);
    const existing = store.cmsPages.find((entry) => entry.id === req.params.id || entry.slug === req.params.id);
    if (!existing) throw new Error("CMS page not found");
    if (!existing.sections.some((section) => section.id === sectionId)) {
      throw new Error("CMS section not found");
    }

    const page = cleanPagePayload(
      {
        ...existing,
        sections: existing.sections.map((section) => section.id === sectionId ? { ...section, ...req.body, id: section.id } : section),
      },
      existing,
    );
    const section = page.sections.find((entry) => entry.id === sectionId);
    page.versionHistory = existing.versionHistory || [];
    store.cmsPages = store.cmsPages.map((entry) => entry.id === existing.id ? page : entry);
    store.auditLogs.unshift(createAuditLogEntry({
      actorUserId: req.authUser?.id,
      actorName: req.authUser?.name || req.authUser?.email || "Admin",
      actorRole: req.authUser?.role || "admin",
      action: "cms.section.updated",
      entityType: "cms-section",
      entityId: sectionId,
      summary: `Updated section ${section?.title || sectionId} on ${page.title}`,
    }));
    return section;
  });
  res.json(updated);
});

router.delete("/:id/sections/:sectionId", requireAdmin, async (req, res): Promise<void> => {
  await updateStore((store) => {
    const sectionId = String(req.params.sectionId);
    const existing = store.cmsPages.find((entry) => entry.id === req.params.id || entry.slug === req.params.id);
    if (!existing) throw new Error("CMS page not found");
    const page = cleanPagePayload(
      {
        ...existing,
        sections: existing.sections.filter((section) => section.id !== sectionId),
      },
      existing,
    );
    page.versionHistory = existing.versionHistory || [];
    store.cmsPages = store.cmsPages.map((entry) => entry.id === existing.id ? page : entry);
    store.auditLogs.unshift(createAuditLogEntry({
      actorUserId: req.authUser?.id,
      actorName: req.authUser?.name || req.authUser?.email || "Admin",
      actorRole: req.authUser?.role || "admin",
      action: "cms.section.deleted",
      entityType: "cms-section",
      entityId: sectionId,
      summary: `Deleted section from ${page.title}`,
    }));
  });
  res.status(204).end();
});

router.delete("/:id", requireAdmin, async (req, res): Promise<void> => {
  await updateStore((store) => {
    const page = store.cmsPages.find((entry) => entry.id === req.params.id || entry.slug === req.params.id);
    if (!page) return;
    store.cmsPages = store.cmsPages.filter((entry) => entry.id !== page.id);
    store.auditLogs.unshift(createAuditLogEntry({
      actorUserId: req.authUser?.id,
      actorName: req.authUser?.name || req.authUser?.email || "Admin",
      actorRole: req.authUser?.role || "admin",
      action: "cms.page.deleted",
      entityType: "cms-page",
      entityId: page.id,
      summary: `Deleted CMS page ${page.title}`,
    }));
  });
  res.status(204).end();
});

export default router;
