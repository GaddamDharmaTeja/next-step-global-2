import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSiteContent, updateSiteContent, uploadAdminMedia, type SiteContentRecord } from "@/lib/api";
import { assetUrl } from "@/lib/runtime";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Save, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const contentSchema = z.object({
  heroTitle: z.string().min(1),
  heroAccent: z.string().min(1),
  heroSubtitle: z.string().min(1),
  brandLogoUrl: z.string().optional(),
  heroBackgroundImage: z.string().optional(),
  heroRightImage: z.string().optional(),
  primaryCta: z.string().min(1),
  secondaryCta: z.string().min(1),
  metrics: z.string().min(1),
  mentorshipTitle: z.string().min(1),
  mentorshipSubtitle: z.string().min(1),
  services: z.string().min(1),
  faqs: z.string().min(1),
  intakeTimeline: z.string().min(1),
  aboutTitle: z.string().min(1),
  aboutText: z.string().min(1),
  aboutHighlights: z.string().min(1),
  contactTitle: z.string().min(1),
  contactText: z.string().min(1),
  contactEmail: z.string().min(1),
  contactPhone: z.string().min(1),
  footerTagline: z.string().min(1),
});

type ContentForm = z.infer<typeof contentSchema>;

function metricsToText(metrics: SiteContentRecord["metrics"]) {
  return metrics.map((metric) => `${metric.value} | ${metric.label}`).join("\n");
}

function servicesToText(services: SiteContentRecord["services"]) {
  return services.map((service) => `${service.title} | ${service.text}`).join("\n");
}

function faqsToText(faqs: SiteContentRecord["faqs"]) {
  return faqs.map((faq) => `${faq.question} | ${faq.answer}`).join("\n");
}

function intakeTimelineToText(intakes: SiteContentRecord["intakeTimeline"]) {
  return intakes.map((intake) => `${intake.intake} | ${intake.deadline} | ${intake.description}`).join("\n");
}

function listToText(items: string[]) {
  return items.join("\n");
}

function parsePipedRows(value: string) {
  return value
    .split(/\r?\n/)
    .map((row) => row.split("|").map((part) => part.trim()))
    .filter((parts) => parts[0] && parts[1]);
}

function toPayload(values: ContentForm): SiteContentRecord {
  return {
    ...values,
    brandLogoUrl: values.brandLogoUrl?.trim() || null,
    heroBackgroundImage: values.heroBackgroundImage?.trim() || null,
    heroRightImage: values.heroRightImage?.trim() || null,
    metrics: parsePipedRows(values.metrics).map(([value = "", label = ""]) => ({ value, label })),
    services: parsePipedRows(values.services).map(([title = "", text = ""]) => ({ title, text })),
    faqs: parsePipedRows(values.faqs).map(([question = "", answer = ""]) => ({ question, answer })),
    intakeTimeline: parsePipedRows(values.intakeTimeline).map(([intake = "", deadline = "", description = ""]) => ({ intake, deadline, description })),
    aboutHighlights: values.aboutHighlights.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
  };
}

function AssetField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadAdminMedia({ file, category: "site-content" });
      onChange(media.url);
      toast({ title: "Image uploaded", description: media.name || media.url });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {value ? (
        <img src={assetUrl(value)} alt="" className="h-28 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain p-2" />
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
          <ImageIcon className="h-8 w-8" />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="/api/images/..." />
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-[#101b31] shadow-sm hover:bg-slate-50">
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
    </div>
  );
}

export default function AdminContentPage() {
  const { data: content, isLoading } = useQuery({ queryKey: ["/api/site-content"], queryFn: getSiteContent });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm<ContentForm>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      heroTitle: "",
      heroAccent: "",
      heroSubtitle: "",
      brandLogoUrl: "",
      heroBackgroundImage: "",
      heroRightImage: "",
      primaryCta: "",
      secondaryCta: "",
      metrics: "",
      mentorshipTitle: "",
      mentorshipSubtitle: "",
      services: "",
      faqs: "",
      intakeTimeline: "",
      aboutTitle: "",
      aboutText: "",
      aboutHighlights: "",
      contactTitle: "",
      contactText: "",
      contactEmail: "",
      contactPhone: "",
      footerTagline: "",
    },
  });

  useEffect(() => {
    if (!content) return;
    form.reset({
      ...content,
      brandLogoUrl: content.brandLogoUrl || "",
      heroBackgroundImage: content.heroBackgroundImage || "",
      heroRightImage: content.heroRightImage || "",
      metrics: metricsToText(content.metrics),
      services: servicesToText(content.services),
      faqs: faqsToText(content.faqs || []),
      intakeTimeline: intakeTimelineToText(content.intakeTimeline || []),
      aboutHighlights: listToText(content.aboutHighlights || []),
    });
  }, [content, form]);

  const onSubmit = async (values: ContentForm) => {
    try {
      await updateSiteContent(toPayload(values));
      toast({ title: "Site content updated" });
      await queryClient.invalidateQueries({ queryKey: ["/api/site-content"] });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to update content",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Site Content</h2>
          <p className="text-muted-foreground">Edit the public website sections using nextstepglobal.net as the reference.</p>
        </div>

        <div className="modern-admin-panel p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="heroTitle" render={({ field }) => (
                  <FormItem><FormLabel>Hero Title</FormLabel><FormControl><Input placeholder="Start Your Learning Journey" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="heroAccent" render={({ field }) => (
                  <FormItem><FormLabel>Hero Accent</FormLabel><FormControl><Input placeholder="Now" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="heroSubtitle" render={({ field }) => (
                <FormItem><FormLabel>Hero Subtitle</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField control={form.control} name="brandLogoUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl><AssetField label="Upload Logo" value={field.value} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBackgroundImage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero Background</FormLabel>
                    <FormControl><AssetField label="Upload Background" value={field.value} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroRightImage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero Right Image</FormLabel>
                    <FormControl><AssetField label="Upload Right Image" value={field.value} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="primaryCta" render={({ field }) => (
                  <FormItem><FormLabel>Primary Button</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="secondaryCta" render={({ field }) => (
                  <FormItem><FormLabel>Secondary Button</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="metrics" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stats / Counters</FormLabel>
                  <FormControl><Textarea rows={5} placeholder={"9394+ | Enrolled Learners\n534+ | Universities\n100% | Free Services"} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="mentorshipTitle" render={({ field }) => (
                  <FormItem><FormLabel>Services Section Title</FormLabel><FormControl><Input placeholder="Our Services" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mentorshipSubtitle" render={({ field }) => (
                  <FormItem><FormLabel>Services Intro</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="services" render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Cards</FormLabel>
                  <FormControl><Textarea rows={8} placeholder="College & University Admission | College and university admission process can be simplified with guidance." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="intakeTimeline" render={({ field }) => (
                <FormItem>
                  <FormLabel>Intake Timeline</FormLabel>
                  <FormControl><Textarea rows={5} placeholder={"January 2026 | Apply by August - October 2025 | Best for students with documents ready\nSeptember 2026 | Apply by March - June 2026 | Major intake with maximum options"} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="faqs" render={({ field }) => (
                <FormItem>
                  <FormLabel>FAQs</FormLabel>
                  <FormControl><Textarea rows={7} placeholder="Can I apply without IELTS? | Some universities accept MOI, Duolingo, PTE, or internal English assessment." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="aboutTitle" render={({ field }) => (
                  <FormItem><FormLabel>About Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="aboutText" render={({ field }) => (
                  <FormItem><FormLabel>About Text</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="aboutHighlights" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome / Services Bullets</FormLabel>
                    <FormControl><Textarea rows={5} placeholder="Funding Guidance" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contactTitle" render={({ field }) => (
                  <FormItem><FormLabel>Contact Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactText" render={({ field }) => (
                  <FormItem><FormLabel>Contact Text</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                  <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactPhone" render={({ field }) => (
                  <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="footerTagline" render={({ field }) => (
                  <FormItem><FormLabel>Footer Tagline</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Saving..." : "Save Content"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}
