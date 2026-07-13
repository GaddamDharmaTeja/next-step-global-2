import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  Copy,
  Eye,
  FilePlus2,
  Globe2,
  History,
  Image as ImageIcon,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  createCmsPage,
  getCmsPage,
  listCmsPages,
  updateCmsPage,
  uploadAdminMedia,
  type CmsPageRecord,
  type CmsPageStatus,
} from "@/lib/api";
import { assetUrl } from "@/lib/runtime";

type ArrayName = "sections" | "cards" | "faqs" | "testimonials" | "gallery";

const headerPageSlugs = ["home", "services", "destinations", "consultants", "about", "contact", "portal"];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pageUrl(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
}

function titleFromSlug(slug?: string | null) {
  const clean = (slug || "page").replace(/[-_]+/g, " ").trim();
  return clean ? clean.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Page";
}

function emptyPage(title = "New Page"): CmsPageRecord {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "new-page";
  const now = new Date().toISOString();
  return {
    id: "",
    title,
    slug,
    url: pageUrl(slug),
    seo: { metaTitle: title, metaDescription: "", metaKeywords: "", seoImage: null },
    hero: {
      title,
      subtitle: "",
      description: "",
      backgroundImage: null,
      backgroundVideo: null,
      primaryButtonText: "Ask an Advisor",
      primaryButtonLink: "/contact",
      secondaryButtonText: "Explore Programs",
      secondaryButtonLink: "/programs",
      visible: true,
    },
    sections: [],
    cards: [],
    faqs: [],
    testimonials: [],
    gallery: [],
    cta: { heading: "", description: "", buttonText: "Talk to Advisor", buttonLink: "/contact", backgroundColor: "#07162f" },
    footerText: "",
    status: "draft",
    scheduledPublishAt: null,
    visible: true,
    versionHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeCmsPage(page?: CmsPageRecord | null): CmsPageRecord {
  const safeTitle = page?.title?.trim() || page?.hero?.title?.trim() || titleFromSlug(page?.slug);
  const fallback = emptyPage(safeTitle);
  if (!page) return fallback;

  return {
    ...fallback,
    ...page,
    title: safeTitle,
    seo: { ...fallback.seo, ...(page.seo || {}) },
    hero: { ...fallback.hero, ...(page.hero || {}), title: page.hero?.title?.trim() || safeTitle },
    sections: Array.isArray(page.sections) ? page.sections : [],
    cards: Array.isArray(page.cards) ? page.cards : [],
    faqs: Array.isArray(page.faqs) ? page.faqs : [],
    testimonials: Array.isArray(page.testimonials) ? page.testimonials : [],
    gallery: Array.isArray(page.gallery) ? page.gallery : [],
    cta: { ...fallback.cta, ...(page.cta || {}) },
    versionHistory: Array.isArray(page.versionHistory) ? page.versionHistory : [],
  };
}

function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function UploadField({
  value,
  label,
  onChange,
}: {
  value?: string | null;
  label: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadAdminMedia({ file, category: "cms" });
      onChange(media.url);
      toast({ title: "Image uploaded", description: media.name || media.url });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="/uploads/media/image.webp" />
      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#101b31] shadow-sm hover:bg-slate-50">
        <UploadCloud className="h-4 w-4" />
        {uploading ? "Uploading..." : label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0])}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

export default function AdminCmsPagesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<CmsPageRecord>(() => emptyPage("New Page"));
  const [saving, setSaving] = useState(false);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["/api/cms-pages", "admin"],
    queryFn: () => listCmsPages({ includeDrafts: true }),
  });

  const { data: selectedPage } = useQuery({
    queryKey: ["/api/cms-pages", selectedId, "admin"],
    queryFn: () => getCmsPage(selectedId, { includeDrafts: true }),
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    if (!selectedId && pages.length > 0) {
      setSelectedId(pages.find((page) => page.slug === "home")?.id || pages[0].id);
    }
  }, [pages, selectedId]);

  useEffect(() => {
    if (selectedPage) setDraft(normalizeCmsPage(selectedPage));
  }, [selectedPage]);

  const filteredPages = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return pages.filter((page) => !needle || page.title.toLowerCase().includes(needle) || page.slug.includes(needle));
  }, [pages, search]);

  const updateDraft = (patch: Partial<CmsPageRecord>) => setDraft((current) => ({ ...current, ...patch }));
  const updateSeo = (patch: Partial<CmsPageRecord["seo"]>) => setDraft((current) => ({ ...current, seo: { ...current.seo, ...patch } }));
  const updateHero = (patch: Partial<CmsPageRecord["hero"]>) => setDraft((current) => ({ ...current, hero: { ...current.hero, ...patch } }));
  const updateCta = (patch: Partial<CmsPageRecord["cta"]>) => setDraft((current) => ({ ...current, cta: { ...current.cta, ...patch } }));

  const updateItem = <K extends ArrayName>(name: K, id: string, patch: Partial<CmsPageRecord[K][number]>) => {
    setDraft((current) => ({
      ...current,
      [name]: (current[name] as Array<{ id: string }>).map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
  };

  const removeItem = (name: ArrayName, id: string) => {
    setDraft((current) => ({ ...current, [name]: (current[name] as Array<{ id: string }>).filter((item) => item.id !== id) }));
  };

  const addItem = (name: ArrayName) => {
    setDraft((current) => {
      const nextOrder = (current[name] as Array<{ order?: number }>).length + 1;
      const item =
        name === "sections" ? {
          id: uid("section"), title: "New Section", subtitle: "", richText: "", images: [], videos: [], icons: [], buttonText: "", buttonLink: "", backgroundColor: "#ffffff", order: nextOrder, enabled: true,
        } :
        name === "cards" ? {
          id: uid("card"), image: null, icon: "Globe", title: "New Card", description: "", link: "/contact", order: nextOrder, active: true,
        } :
        name === "faqs" ? {
          id: uid("faq"), question: "New question?", answer: "", order: nextOrder,
        } :
        name === "testimonials" ? {
          id: uid("testimonial"), clientName: "Client Name", designation: "", review: "", rating: 5, photo: null,
        } : {
          id: uid("gallery"), image: "", caption: "", order: nextOrder,
        };
      return { ...current, [name]: [...(current[name] as unknown[]), item] };
    });
  };

  const createNewPage = () => {
    setSelectedId("");
    setDraft(emptyPage("New Page"));
  };

  const savePage = async (status?: CmsPageStatus) => {
    setSaving(true);
    try {
      const slug = draft.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "new-page";
      const payload = { ...normalizeCmsPage(draft), slug, url: draft.url || pageUrl(slug), status: status || draft.status };
      const saved = payload.id ? await updateCmsPage(payload.id, payload) : await createCmsPage(payload);
      setDraft(saved);
      setSelectedId(saved.id);
      await queryClient.invalidateQueries({ queryKey: ["/api/cms-pages"] });
      toast({ title: saved.status === "published" ? "Page published" : "Draft saved", description: saved.title });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save page", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)_360px]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Pages CMS</h2>
              <p className="text-sm text-slate-500">Header pages and future pages.</p>
            </div>
            <Button size="icon" className="rounded-xl bg-[#101b31]" onClick={createNewPage} title="Create page">
              <FilePlus2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pages..." />
          </div>
          <div className="mt-4 space-y-2">
            {isLoading && <div className="p-4 text-sm text-slate-500">Loading pages...</div>}
            {filteredPages.map((page) => (
              <button
                key={page.id}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedId === page.id
                    ? "border-[#d9a31a]/50 bg-[#fff8e6] shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                onClick={() => setSelectedId(page.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-slate-900">{page.title}</div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase ${page.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {page.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-500">{page.url}</div>
                {headerPageSlugs.includes(page.slug) && <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#a77400]">Header Navigation</div>}
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 rounded-3xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#a77400]">Content Management</div>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">Edit {draft.title}</h1>
                <p className="mt-1 text-sm text-slate-500">SEO, hero, page sections, cards, FAQs, gallery, CTA, publishing, and history.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => savePage("draft")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" /> Save Draft
                </Button>
                <Button className="rounded-xl bg-[#101b31] text-white" onClick={() => savePage("published")} disabled={saving}>
                  <Globe2 className="mr-2 h-4 w-4" /> Publish
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="basic" className="p-6">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 md:grid-cols-4 xl:grid-cols-8">
              {["basic", "hero", "sections", "cards", "faq", "social", "gallery", "publish"].map((tab) => (
                <TabsTrigger key={tab} value={tab} className="rounded-xl capitalize">{tab}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="basic" className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Page Title"><Input value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} /></Field>
                <Field label="Page Slug"><Input value={draft.slug} onChange={(e) => updateDraft({ slug: e.target.value, url: pageUrl(e.target.value) })} /></Field>
                <Field label="Page URL"><Input value={draft.url} onChange={(e) => updateDraft({ url: e.target.value })} /></Field>
                <Field label="Meta Title"><Input value={draft.seo.metaTitle} onChange={(e) => updateSeo({ metaTitle: e.target.value })} /></Field>
              </div>
              <Field label="Meta Description"><Textarea rows={3} value={draft.seo.metaDescription} onChange={(e) => updateSeo({ metaDescription: e.target.value })} /></Field>
              <Field label="Meta Keywords"><Input value={draft.seo.metaKeywords} onChange={(e) => updateSeo({ metaKeywords: e.target.value })} /></Field>
              <Field label="SEO Image"><UploadField label="Upload SEO" value={draft.seo.seoImage} onChange={(url) => updateSeo({ seoImage: url })} /></Field>
            </TabsContent>

            <TabsContent value="hero" className="mt-6 space-y-5">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div><div className="font-bold">Show Hero</div><div className="text-sm text-slate-500">Hide this page hero without deleting content.</div></div>
                <Switch checked={draft.hero.visible} onCheckedChange={(checked) => updateHero({ visible: checked })} />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Hero Title"><Input value={draft.hero.title} onChange={(e) => updateHero({ title: e.target.value })} /></Field>
                <Field label="Hero Subtitle"><Input value={draft.hero.subtitle} onChange={(e) => updateHero({ subtitle: e.target.value })} /></Field>
              </div>
              <Field label="Description"><Textarea rows={4} value={draft.hero.description} onChange={(e) => updateHero({ description: e.target.value })} /></Field>
              <Field label="Background Image"><UploadField label="Upload Hero" value={draft.hero.backgroundImage} onChange={(url) => updateHero({ backgroundImage: url })} /></Field>
              <Field label="Background Video Optional"><Input value={draft.hero.backgroundVideo || ""} onChange={(e) => updateHero({ backgroundVideo: e.target.value })} /></Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Primary Button Text"><Input value={draft.hero.primaryButtonText} onChange={(e) => updateHero({ primaryButtonText: e.target.value })} /></Field>
                <Field label="Primary Button Link"><Input value={draft.hero.primaryButtonLink} onChange={(e) => updateHero({ primaryButtonLink: e.target.value })} /></Field>
                <Field label="Secondary Button Text"><Input value={draft.hero.secondaryButtonText} onChange={(e) => updateHero({ secondaryButtonText: e.target.value })} /></Field>
                <Field label="Secondary Button Link"><Input value={draft.hero.secondaryButtonLink} onChange={(e) => updateHero({ secondaryButtonLink: e.target.value })} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="sections" className="mt-6 space-y-4">
              <Button className="rounded-xl" onClick={() => addItem("sections")}><Plus className="mr-2 h-4 w-4" /> Add Section</Button>
              {sortByOrder(draft.sections).map((section) => (
                <Card key={section.id} className="rounded-2xl border-slate-200">
                  <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <CardTitle className="text-lg">{section.title || "Untitled Section"}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => removeItem("sections", section.id)}><Trash2 className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Section Title"><Input value={section.title} onChange={(e) => updateItem("sections", section.id, { title: e.target.value })} /></Field>
                      <Field label="Subtitle"><Input value={section.subtitle} onChange={(e) => updateItem("sections", section.id, { subtitle: e.target.value })} /></Field>
                      <Field label="Button Text"><Input value={section.buttonText} onChange={(e) => updateItem("sections", section.id, { buttonText: e.target.value })} /></Field>
                      <Field label="Button Link"><Input value={section.buttonLink} onChange={(e) => updateItem("sections", section.id, { buttonLink: e.target.value })} /></Field>
                      <Field label="Background Color"><Input type="color" value={section.backgroundColor || "#ffffff"} onChange={(e) => updateItem("sections", section.id, { backgroundColor: e.target.value })} /></Field>
                      <Field label="Order"><Input type="number" value={section.order} onChange={(e) => updateItem("sections", section.id, { order: Number(e.target.value) })} /></Field>
                    </div>
                    <Field label="Rich Text Editor"><Textarea rows={7} value={section.richText} onChange={(e) => updateItem("sections", section.id, { richText: e.target.value })} /></Field>
                    <Field label="Images, Videos, Icons"><Input value={[...section.images, ...section.videos, ...section.icons].join(", ")} onChange={(e) => updateItem("sections", section.id, { images: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="Comma separated image URLs" /></Field>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="font-semibold">Enable Section</span><Switch checked={section.enabled} onCheckedChange={(checked) => updateItem("sections", section.id, { enabled: checked })} /></div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="cards" className="mt-6 space-y-4">
              <Button className="rounded-xl" onClick={() => addItem("cards")}><Plus className="mr-2 h-4 w-4" /> Add Card</Button>
              {sortByOrder(draft.cards).map((card) => (
                <Card key={card.id} className="rounded-2xl border-slate-200">
                  <CardContent className="grid gap-4 p-5">
                    <div className="flex items-center justify-between"><strong>{card.title || "Untitled Card"}</strong><Button variant="ghost" size="icon" onClick={() => removeItem("cards", card.id)}><Trash2 className="h-4 w-4" /></Button></div>
                    <UploadField label="Upload Card" value={card.image} onChange={(url) => updateItem("cards", card.id, { image: url })} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Icon"><Input value={card.icon} onChange={(e) => updateItem("cards", card.id, { icon: e.target.value })} /></Field>
                      <Field label="Title"><Input value={card.title} onChange={(e) => updateItem("cards", card.id, { title: e.target.value })} /></Field>
                      <Field label="Link"><Input value={card.link} onChange={(e) => updateItem("cards", card.id, { link: e.target.value })} /></Field>
                      <Field label="Display Order"><Input type="number" value={card.order} onChange={(e) => updateItem("cards", card.id, { order: Number(e.target.value) })} /></Field>
                    </div>
                    <Field label="Description"><Textarea rows={3} value={card.description} onChange={(e) => updateItem("cards", card.id, { description: e.target.value })} /></Field>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="font-semibold">Active</span><Switch checked={card.active} onCheckedChange={(checked) => updateItem("cards", card.id, { active: checked })} /></div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="faq" className="mt-6 space-y-4">
              <Button className="rounded-xl" onClick={() => addItem("faqs")}><Plus className="mr-2 h-4 w-4" /> Add FAQ</Button>
              {sortByOrder(draft.faqs).map((faq) => (
                <Card key={faq.id} className="rounded-2xl border-slate-200">
                  <CardContent className="grid gap-4 p-5">
                    <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => removeItem("faqs", faq.id)}><Trash2 className="h-4 w-4" /></Button></div>
                    <Field label="Question"><Input value={faq.question} onChange={(e) => updateItem("faqs", faq.id, { question: e.target.value })} /></Field>
                    <Field label="Answer"><Textarea rows={3} value={faq.answer} onChange={(e) => updateItem("faqs", faq.id, { answer: e.target.value })} /></Field>
                    <Field label="Sort Order"><Input type="number" value={faq.order} onChange={(e) => updateItem("faqs", faq.id, { order: Number(e.target.value) })} /></Field>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="social" className="mt-6 space-y-4">
              <Button className="rounded-xl" onClick={() => addItem("testimonials")}><Plus className="mr-2 h-4 w-4" /> Add Testimonial</Button>
              {draft.testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="rounded-2xl border-slate-200">
                  <CardContent className="grid gap-4 p-5">
                    <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => removeItem("testimonials", testimonial.id)}><Trash2 className="h-4 w-4" /></Button></div>
                    <UploadField label="Upload Photo" value={testimonial.photo} onChange={(url) => updateItem("testimonials", testimonial.id, { photo: url })} />
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Client Name"><Input value={testimonial.clientName} onChange={(e) => updateItem("testimonials", testimonial.id, { clientName: e.target.value })} /></Field>
                      <Field label="Designation"><Input value={testimonial.designation} onChange={(e) => updateItem("testimonials", testimonial.id, { designation: e.target.value })} /></Field>
                      <Field label="Rating"><Input type="number" min={1} max={5} value={testimonial.rating} onChange={(e) => updateItem("testimonials", testimonial.id, { rating: Number(e.target.value) })} /></Field>
                    </div>
                    <Field label="Review"><Textarea rows={3} value={testimonial.review} onChange={(e) => updateItem("testimonials", testimonial.id, { review: e.target.value })} /></Field>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="gallery" className="mt-6 space-y-4">
              <Button className="rounded-xl" onClick={() => addItem("gallery")}><Plus className="mr-2 h-4 w-4" /> Add Gallery Image</Button>
              {sortByOrder(draft.gallery).map((item) => (
                <Card key={item.id} className="rounded-2xl border-slate-200">
                  <CardContent className="grid gap-4 p-5">
                    <div className="flex justify-end"><Button variant="ghost" size="icon" onClick={() => removeItem("gallery", item.id)}><Trash2 className="h-4 w-4" /></Button></div>
                    <UploadField label="Upload Image" value={item.image} onChange={(url) => updateItem("gallery", item.id, { image: url })} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Caption"><Input value={item.caption} onChange={(e) => updateItem("gallery", item.id, { caption: e.target.value })} /></Field>
                      <Field label="Order"><Input type="number" value={item.order} onChange={(e) => updateItem("gallery", item.id, { order: Number(e.target.value) })} /></Field>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="publish" className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Status"><Input value={draft.status} onChange={(e) => updateDraft({ status: e.target.value === "published" ? "published" : "draft" })} /></Field>
                <Field label="Schedule Publish"><Input type="datetime-local" value={draft.scheduledPublishAt?.slice(0, 16) || ""} onChange={(e) => updateDraft({ scheduledPublishAt: e.target.value ? new Date(e.target.value).toISOString() : null })} /></Field>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div><div className="font-bold">Show Page</div><div className="text-sm text-slate-500">Visible pages can be loaded on the website.</div></div>
                <Switch checked={draft.visible} onCheckedChange={(checked) => updateDraft({ visible: checked })} />
              </div>
              <Field label="CTA Heading"><Input value={draft.cta.heading} onChange={(e) => updateCta({ heading: e.target.value })} /></Field>
              <Field label="CTA Description"><Textarea rows={3} value={draft.cta.description} onChange={(e) => updateCta({ description: e.target.value })} /></Field>
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="CTA Button Text"><Input value={draft.cta.buttonText} onChange={(e) => updateCta({ buttonText: e.target.value })} /></Field>
                <Field label="CTA Button Link"><Input value={draft.cta.buttonLink} onChange={(e) => updateCta({ buttonLink: e.target.value })} /></Field>
                <Field label="CTA Background"><Input type="color" value={draft.cta.backgroundColor || "#07162f"} onChange={(e) => updateCta({ backgroundColor: e.target.value })} /></Field>
              </div>
              <Field label="Custom Footer Text"><Textarea rows={3} value={draft.footerText} onChange={(e) => updateDraft({ footerText: e.target.value })} /></Field>
            </TabsContent>
          </Tabs>
        </main>

        <aside className="space-y-5">
          <Card className="rounded-3xl border-slate-200 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Live Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                {draft.hero.backgroundImage ? (
                  <img src={assetUrl(draft.hero.backgroundImage)} alt="" className="mb-4 aspect-video w-full rounded-xl object-cover" />
                ) : (
                  <div className="mb-4 flex aspect-video items-center justify-center rounded-xl bg-white text-slate-400"><ImageIcon className="h-10 w-10" /></div>
                )}
                <h3 className="font-serif text-2xl font-bold text-[#07162f]">{draft.hero.title || draft.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{draft.hero.subtitle || draft.hero.description}</p>
                <div className="mt-4 flex gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">{draft.status}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">{draft.visible ? "Visible" : "Hidden"}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <a href={draft.url || pageUrl(draft.slug)} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full rounded-xl"><ArrowUpRight className="mr-2 h-4 w-4" /> Open Live Page</Button>
                </a>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => navigator.clipboard.writeText(draft.url || pageUrl(draft.slug))}>
                  <Copy className="mr-2 h-4 w-4" /> Copy URL
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Publish Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div>Updated: {new Date(draft.updatedAt).toLocaleString()}</div>
              <div>Scheduled: {draft.scheduledPublishAt ? new Date(draft.scheduledPublishAt).toLocaleString() : "Not scheduled"}</div>
              <div>Sections: {draft.sections.length}</div>
              <div>Cards: {draft.cards.length}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Version History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {draft.versionHistory.length === 0 && <div className="text-sm text-slate-500">No saved versions yet.</div>}
              {draft.versionHistory.slice(0, 8).map((version) => (
                <div key={version.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="font-bold text-slate-900">{version.title}</div>
                  <div className="text-slate-500">{new Date(version.savedAt).toLocaleString()} by {version.savedBy}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </AdminLayout>
  );
}
