import { Link } from "wouter";
import { ArrowRight, Quote, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCmsPage, type CmsPageRecord } from "@/lib/api";
import { assetUrl } from "@/lib/runtime";

type CmsPublicPageProps = {
  slug: string;
  active?: "home" | "services" | "destinations" | "consultants" | "about" | "contact" | "portal";
};

function cleanHtml(value: unknown) {
  return String(value || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function pageImage(url?: string | null) {
  return url ? assetUrl(url) : "";
}

function titleFromSlug(slug?: string | null) {
  const clean = (slug || "page").replace(/[-_]+/g, " ").trim();
  return clean ? clean.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Page";
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeCmsPage(page: CmsPageRecord): CmsPageRecord {
  const title = page.title?.trim() || page.hero?.title?.trim() || titleFromSlug(page.slug);
  const slug = page.slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "page";

  return {
    ...page,
    title,
    slug,
    url: page.url || (slug === "home" ? "/" : `/${slug}`),
    seo: page.seo || { metaTitle: title, metaDescription: "", metaKeywords: "", seoImage: null },
    hero: {
      title: page.hero?.title?.trim() || title,
      subtitle: page.hero?.subtitle || "",
      description: page.hero?.description || "",
      backgroundImage: page.hero?.backgroundImage || null,
      backgroundVideo: page.hero?.backgroundVideo || null,
      primaryButtonText: page.hero?.primaryButtonText || "Ask an Advisor",
      primaryButtonLink: page.hero?.primaryButtonLink || "/contact",
      secondaryButtonText: page.hero?.secondaryButtonText || "Explore Programs",
      secondaryButtonLink: page.hero?.secondaryButtonLink || "/programs",
      visible: typeof page.hero?.visible === "boolean" ? page.hero.visible : true,
    },
    sections: safeArray<CmsPageRecord["sections"][number]>(page.sections),
    cards: safeArray<CmsPageRecord["cards"][number]>(page.cards),
    faqs: safeArray<CmsPageRecord["faqs"][number]>(page.faqs),
    testimonials: safeArray<CmsPageRecord["testimonials"][number]>(page.testimonials),
    gallery: safeArray<CmsPageRecord["gallery"][number]>(page.gallery),
    cta: page.cta || {
      heading: "",
      description: "",
      buttonText: "Talk to Advisor",
      buttonLink: "/contact",
      backgroundColor: "#07162f",
    },
    versionHistory: Array.isArray(page.versionHistory) ? page.versionHistory : [],
  };
}

function CmsPageView({ page, active }: { page: CmsPageRecord; active?: CmsPublicPageProps["active"] }) {
  const cmsPage = normalizeCmsPage(page);
  const enabledSections = safeArray<CmsPageRecord["sections"][number]>(cmsPage.sections)
    .filter((section) => section?.enabled !== false)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const activeCards = safeArray<CmsPageRecord["cards"][number]>(cmsPage.cards)
    .filter((card) => card?.active !== false)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const faqs = safeArray<CmsPageRecord["faqs"][number]>(cmsPage.faqs)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const gallery = safeArray<CmsPageRecord["gallery"][number]>(cmsPage.gallery)
    .filter((item) => item?.image)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const testimonials = safeArray<CmsPageRecord["testimonials"][number]>(cmsPage.testimonials);

  return (
    <div className="modern-page-shell">
      <PublicHeader active={active} />

      {cmsPage.hero.visible && (
        <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_100%)] py-20">
          {cmsPage.hero.backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-12"
              style={{ backgroundImage: `url(${pageImage(cmsPage.hero.backgroundImage)})` }}
            />
          )}
          <div className={`relative mx-auto grid max-w-7xl gap-10 px-5 lg:items-center lg:px-8 ${
            cmsPage.hero.backgroundImage ? "lg:grid-cols-[1fr_0.78fr]" : ""
          }`}>
            <div>
              <div className="modern-kicker">{cmsPage.title}</div>
              <h1 className="mt-5 max-w-4xl font-serif text-5xl font-bold leading-tight text-[#07162f] md:text-6xl">
                {cmsPage.hero.title || cmsPage.title}
              </h1>
              {cmsPage.hero.subtitle && <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-600">{cmsPage.hero.subtitle}</p>}
              {cmsPage.hero.description && <p className="mt-5 max-w-3xl leading-8 text-slate-600">{cmsPage.hero.description}</p>}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {cmsPage.hero.primaryButtonText && (
                  <Link href={cmsPage.hero.primaryButtonLink || "/contact"}>
                    <Button className="h-12 rounded-xl bg-[#101b31] px-6 text-white hover:bg-[#172846]">
                      {cmsPage.hero.primaryButtonText} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {cmsPage.hero.secondaryButtonText && (
                  <Link href={cmsPage.hero.secondaryButtonLink || "/contact"}>
                    <Button variant="outline" className="h-12 rounded-xl border-slate-300 px-6 text-[#101b31]">
                      {cmsPage.hero.secondaryButtonText}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {cmsPage.hero.backgroundImage && (
              <div className="hidden rounded-3xl border border-white bg-white/70 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur lg:block">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                  <img src={pageImage(cmsPage.hero.backgroundImage)} alt={cmsPage.hero.title} className="h-full w-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activeCards.length > 0 && (
        <section className="bg-white py-18">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-2 xl:grid-cols-3 lg:px-8">
            {activeCards.map((card) => (
              <Card key={card.id} className="h-full rounded-2xl border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
                {card.image && <img src={pageImage(card.image)} alt={card.title} className="h-48 w-full rounded-t-2xl object-cover" />}
                <CardContent className="p-7">
                  <div className="mb-5 inline-flex rounded-xl bg-[#f8fafc] px-3 py-2 text-sm font-bold text-[#a77400]">{card.icon || "Section"}</div>
                  <h2 className="font-serif text-2xl font-bold text-[#07162f]">{card.title}</h2>
                  <p className="mt-4 leading-7 text-slate-600">{card.description}</p>
                  {card.link && (
                    <Link href={card.link}>
                      <Button variant="outline" className="mt-6 h-11 rounded-xl">View Details</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {enabledSections.map((section) => (
        <section key={section.id} className="py-18" style={{ backgroundColor: section.backgroundColor || "#ffffff" }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <h2 className="font-serif text-4xl font-bold text-[#07162f]">{section.title}</h2>
                {section.subtitle && <p className="mt-4 text-lg leading-8 text-slate-600">{section.subtitle}</p>}
                {section.buttonText && (
                  <Link href={section.buttonLink || "/contact"}>
                    <Button className="mt-8 h-12 rounded-xl bg-[#101b31] px-6 text-white hover:bg-[#172846]">{section.buttonText}</Button>
                  </Link>
                )}
              </div>
              <div>
                {section.richText && (
                  <div
                    className="prose max-w-none leading-8 text-slate-600"
                    dangerouslySetInnerHTML={{ __html: cleanHtml(section.richText).replace(/\n/g, "<br />") }}
                  />
                )}
                {safeArray<string>(section.images).length > 0 && (
                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    {safeArray<string>(section.images).map((image) => (
                      <img key={image} src={pageImage(image)} alt={section.title} className="aspect-[4/3] rounded-2xl object-cover" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {gallery.length > 0 && (
        <section className="bg-[#f8fafc] py-18">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 className="font-serif text-4xl font-bold text-[#07162f]">Gallery</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item) => (
                <figure key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <img src={pageImage(item.image)} alt={item.caption || cmsPage.title} className="aspect-[4/3] w-full object-cover" />
                  {item.caption && <figcaption className="p-4 text-sm font-medium text-slate-600">{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="bg-white py-18">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 className="font-serif text-4xl font-bold text-[#07162f]">What students say</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="rounded-2xl border-slate-200 shadow-sm">
                  <CardContent className="p-7">
                    <Quote className="h-7 w-7 text-[#d9a31a]" />
                    <div className="mt-4 flex gap-1 text-[#d9a31a]">
                      {Array.from({ length: testimonial.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="mt-4 leading-7 text-slate-600">{testimonial.review}</p>
                    <div className="mt-5 font-bold text-[#07162f]">{testimonial.clientName}</div>
                    <div className="text-sm text-slate-500">{testimonial.designation}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="bg-[#f8fafc] py-18">
          <div className="mx-auto max-w-4xl px-5 lg:px-8">
            <h2 className="font-serif text-4xl font-bold text-[#07162f]">FAQs</h2>
            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <details key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <summary className="cursor-pointer font-bold text-[#07162f]">{faq.question}</summary>
                  <p className="mt-4 leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {cmsPage.cta.heading && (
        <section className="py-18">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="rounded-3xl p-8 text-white md:p-12" style={{ backgroundColor: cmsPage.cta.backgroundColor || "#07162f" }}>
              <h2 className="font-serif text-4xl font-bold">{cmsPage.cta.heading}</h2>
              <p className="mt-4 max-w-3xl leading-8 text-white/80">{cmsPage.cta.description}</p>
              {cmsPage.cta.buttonText && (
                <Link href={cmsPage.cta.buttonLink || "/contact"}>
                  <Button className="mt-7 h-12 rounded-xl bg-[#d9a31a] px-6 text-[#081120] hover:bg-[#c79414]">{cmsPage.cta.buttonText}</Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {cmsPage.footerText && <footer className="bg-[#07162f] px-5 py-8 text-center text-sm text-white/70">{cmsPage.footerText}</footer>}
    </div>
  );
}

export default function CmsPublicPage({ slug, active }: CmsPublicPageProps) {
  const { data: page, isLoading } = useQuery({
    queryKey: ["/api/cms-pages", slug],
    queryFn: () => getCmsPage(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="modern-page-shell">
        <PublicHeader active={active} />
        <div className="mx-auto max-w-7xl px-5 py-20 text-slate-600">Loading page...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="modern-page-shell">
        <PublicHeader />
        <div className="mx-auto max-w-7xl px-5 py-20">
          <h1 className="font-serif text-4xl font-bold text-[#07162f]">Page not found</h1>
          <Link href="/">
            <Button className="mt-6">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <CmsPageView page={page} active={active} />;
}
