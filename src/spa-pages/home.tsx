import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateInquiry,
  useListGalleryImages,
  useListPrograms,
  useListTestimonials,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { applyImageFallback, assetUrl, withBasePath } from "@/lib/runtime";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  GraduationCap,
  HandHeart,
  MapPin,
  Plane,
  Quote,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import { createAppointment, getSiteContent } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { PublicHeader } from "@/components/layout/public-header";

const inquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(5, "Phone number required"),
  whatsapp: z.string().optional(),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Please provide more details"),
});

const appointmentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(5, "Phone number required"),
  destination: z.string().optional(),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  notes: z.string().optional(),
});

const fallbackServices = [
  {
    title: "Admission Counselling",
    text: "Shortlist courses and universities based on academics, budget, intake, location preference, and career outcomes.",
  },
  {
    title: "Funding Guidance",
    text: "Identify realistic fee waivers, assistantships, and profile improvements before deadlines.",
  },
  {
    title: "Visa Documentation",
    text: "Prepare financial documents, SOPs, affidavits, sponsor proof, and visa interview responses with clear checklists.",
  },
];

const processSteps = [
  {
    title: "Profile Evaluation",
    text: "We review academics, work experience, test scores, budget, preferred intake, and destination goals.",
    icon: UsersRound,
  },
  {
    title: "Course Shortlisting",
    text: "You get a practical university list with safe, target, and ambitious options instead of random applications.",
    icon: BookOpenCheck,
  },
  {
    title: "Applications & Documents",
    text: "We organize SOP, LOR, resume, transcripts, financial proof, and application timelines in one flow.",
    icon: FileText,
  },
  {
    title: "Visa & Pre-departure",
    text: "Our team helps with visa readiness, travel planning, accommodation basics, and next steps after approval.",
    icon: Plane,
  },
];

const destinationDetails = [
  { country: "United Kingdom", flag: "🇬🇧", intake: "Jan, May, Sep", tuition: "GBP 12k-28k", strength: "Fast masters, strong employability" },
  { country: "United States", flag: "🇺🇸", intake: "Jan, Aug", tuition: "USD 18k-45k", strength: "Research and STEM pathways" },
  { country: "Australia", flag: "🇦🇺", intake: "Feb, Jul", tuition: "AUD 22k-40k", strength: "Work rights, PR pathways" },
  { country: "Canada", flag: "🇨🇦", intake: "Jan, May, Sep", tuition: "CAD 16k-35k", strength: "Affordable programs, immigration options" },
];

export default function HomePage() {
  const { data: programs } = useListPrograms();
  const { data: testimonials } = useListTestimonials();
  const { data: gallery } = useListGalleryImages();
  const { data: content } = useQuery({ queryKey: ["/api/site-content"], queryFn: getSiteContent });
  const createInquiry = useCreateInquiry();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof inquirySchema>>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: "", email: "", phone: "", whatsapp: "", subject: "", message: "" },
  });
  const appointmentForm = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { name: "", email: "", phone: "", destination: "", preferredDate: "", preferredTime: "", notes: "" },
  });

  const onSubmit = (values: z.infer<typeof inquirySchema>) => {
    createInquiry.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Inquiry submitted successfully!", description: "We will contact you soon." });
          form.reset();
        },
        onError: () => {
          toast({ title: "Failed to submit inquiry", variant: "destructive" });
        },
      },
    );
  };

  const onAppointmentSubmit = async (values: z.infer<typeof appointmentSchema>) => {
    try {
      await createAppointment(values);
      toast({ title: "Consultation requested", description: "Our team will confirm your slot soon." });
      appointmentForm.reset();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to request appointment",
        variant: "destructive",
      });
    }
  };

  const programsList = Array.isArray(programs) ? programs : [];
  const testimonialsList = Array.isArray(testimonials) ? testimonials : [];
  const galleryList = Array.isArray(gallery) ? gallery : [];

  const pinnedPrograms = programsList.filter((p) => p.featured);
  const featuredPrograms = [
    ...pinnedPrograms,
    ...programsList.filter((p) => !pinnedPrograms.some((featured) => featured.id === p.id)),
  ].slice(0, 3);
  const featuredTestimonials = testimonialsList.filter((t) => t.featured) || testimonialsList.slice(0, 3) || [];
  const metrics = Array.isArray(content?.metrics) ? content.metrics : [];
  const serviceIcons = [HandHeart, Globe2, ShieldCheck];
  const services = Array.isArray(content?.services) && content.services.length ? content.services : fallbackServices;
  const faqs = Array.isArray(content?.faqs) ? content.faqs : [];
  const intakeTimeline = Array.isArray(content?.intakeTimeline) ? content.intakeTimeline : [];
  const aboutHighlights = Array.isArray(content?.aboutHighlights) && content.aboutHighlights.length
    ? content.aboutHighlights
    : ["Course shortlisting", "Funding strategy", "Visa documentation", "Pre-departure briefing"];

  return (
    <div className="modern-page-shell">
      <PublicHeader active="home" variant="overlay" />

      <section
        id="home"
        className="relative min-h-[calc(100vh-80px)] overflow-hidden border-b-[28px] border-[#d9a31a] bg-[#09172f] pt-28 sm:pt-32"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: `url(${withBasePath("/hero-student.jpg")})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(9,23,47,0.88),rgba(14,47,109,0.82))]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-108px)] max-w-7xl items-center px-5 py-16 lg:px-8">
          <div className="max-w-3xl text-white">
            <h1 className="font-serif text-6xl font-bold leading-[1.05] md:text-7xl lg:text-8xl">
              {content?.heroTitle || "Your global future"} <span className="text-[#e0b43b]">{content?.heroAccent || "starts here."}</span>
            </h1>
            <p className="mt-8 max-w-2xl text-left text-xl leading-8 text-white md:text-2xl">
              {content?.heroSubtitle || "We do not just process visas; we architect futures. Partner with passionate mentors dedicated to guiding you to the world's top universities."}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="h-14 rounded-md border border-[#d9a31a] bg-[#d9a31a] px-8 text-lg font-semibold text-[#081120] shadow-none hover:bg-[#c79414]"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                {content?.primaryCta || "Get Free Assessment"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-md border-white/35 bg-transparent px-8 text-lg font-semibold text-white shadow-none hover:bg-white/10 hover:text-white"
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
              >
                {content?.secondaryCta || "Explore Services"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(90deg,#0e2f6d_0%,#173f86_52%,#d9a31a_100%)] py-14 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/20 px-5 text-center md:grid-cols-4 lg:px-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="px-4 py-4">
              <div className="font-serif text-5xl font-bold md:text-6xl">{metric.value}</div>
              <div className="mt-3 text-sm font-semibold uppercase text-white md:text-base">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="bg-[#f4f7fb] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-serif text-4xl font-bold text-[#07162f] md:text-5xl">{content?.mentorshipTitle || "A Mentorship Approach"}</h2>
            <p className="mt-6 text-xl leading-8 text-slate-600">
              {content?.mentorshipSubtitle || "We go beyond the paperwork. Our advisors are deeply committed to understanding your aspirations and matching you with institutions where you will thrive."}
            </p>
          </div>

          <div className="mt-20 grid gap-7 md:grid-cols-3">
            {services.map((service, index) => {
              const Icon = serviceIcons[index] || HandHeart;
              return (
                <div key={service.title}>
                  <Card className="h-full rounded-lg border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-10">
                      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-[#101b31]">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mt-10 font-serif text-2xl font-bold text-[#07162f]">{service.title}</h3>
                      <p className="mt-6 text-lg leading-8 text-slate-600">{service.text}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <div className="modern-kicker">How We Work</div>
              <h2 className="mt-5 font-serif text-4xl font-bold text-[#07162f] md:text-5xl">
                A clear admission roadmap from first call to departure.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Students and parents can track every important stage: destination fit, document readiness, university responses, fee payment, visa progress, and pre-departure tasks.
              </p>
              <div className="mt-8 grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#d9a31a]" /> Intake timeline planning</div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#d9a31a]" /> Budget and funding mapping</div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#d9a31a]" /> SOP, LOR, resume support</div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#d9a31a]" /> Visa readiness checklist</div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title} className="h-full rounded-lg border-slate-200 bg-[#f8fbff] shadow-sm">
                    <CardContent className="p-7">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#101b31] text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="font-serif text-3xl font-bold text-[#d9a31a]">0{index + 1}</span>
                      </div>
                      <h3 className="mt-6 font-serif text-2xl font-bold text-[#07162f]">{step.title}</h3>
                      <p className="mt-4 leading-7 text-slate-600">{step.text}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="font-serif text-4xl font-bold text-[#07162f] md:text-5xl">Featured Programs</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Explore practical study pathways built around your academic profile, budget, and long-term career plans.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-12 rounded-md border-[#101b31] px-5 text-base font-semibold text-[#101b31] hover:bg-[#101b31] hover:text-white"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ask an Advisor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-12 grid items-stretch gap-7 md:grid-cols-2 lg:grid-cols-3">
            {featuredPrograms.map((prog) => (
              <div key={prog.id} className="h-full min-w-0">
                <Card className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-[#d9a31a]/45 hover:shadow-[0_22px_52px_rgba(15,23,42,0.1)]">
                  <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-[#f4f7fb]">
                    {prog.imageUrl ? (
                      <img
                        src={assetUrl(prog.imageUrl)}
                        alt={prog.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={applyImageFallback}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#eef3f9)] text-[#101b31]">
                        <Globe2 className="h-12 w-12 opacity-20" />
                      </div>
                    )}
                    <div className="absolute left-5 top-5 max-w-[calc(100%-2.5rem)] rounded-lg bg-white/95 px-4 py-2 text-sm font-bold uppercase leading-5 text-[#101b31] shadow-sm backdrop-blur">
                      {prog.country}
                    </div>
                  </div>
                  <CardContent className="flex min-w-0 flex-1 flex-col p-7">
                    <h3 className="line-clamp-2 min-h-[4rem] font-serif text-[1.7rem] font-bold leading-8 text-[#07162f]">{prog.title}</h3>
                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <GraduationCap className="h-4 w-4" /> {prog.duration}
                    </div>
                    <div className="mt-5 grid content-start gap-4 rounded-xl bg-[#f8fafc] p-5 text-sm text-slate-600">
                      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
                        <span className="font-semibold">Tuition</span>
                        <span className="min-w-0 text-right font-bold leading-5 text-slate-900">{prog.tuitionFee || "Contact us"}</span>
                      </div>
                      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
                        <span className="font-semibold">Intakes</span>
                        <span className="min-w-0 text-right font-bold leading-5 text-slate-900">{prog.intakeMonths?.join(", ") || "Flexible"}</span>
                      </div>
                    </div>
                    <p className="mt-6 line-clamp-4 leading-8 text-slate-600">{prog.description}</p>
                    {(prog.englishRequirement || prog.applicationDeadline) && (
                      <div className="mt-5 space-y-2 text-sm leading-6 text-slate-600">
                        {prog.englishRequirement && <p><span className="font-bold text-slate-900">English:</span> {prog.englishRequirement}</p>}
                        {prog.applicationDeadline && <p><span className="font-bold text-slate-900">Deadline:</span> {prog.applicationDeadline}</p>}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="mt-auto h-11 w-full rounded-xl border-slate-300 pt-0 font-semibold text-[#101b31] hover:bg-[#101b31] hover:text-white"
                      onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f7fb] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="modern-kicker">Country Planning</div>
              <h2 className="mt-5 font-serif text-4xl font-bold text-[#07162f] md:text-5xl">Compare destinations before you apply.</h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                We help students understand intake dates, tuition ranges, work options, and post-study routes before choosing a final country.
              </p>
            </div>
            <Link href="/destinations">
              <Button className="h-12 rounded-md bg-[#101b31] px-6 text-base font-semibold text-white shadow-none hover:bg-[#172846]">
                View Countries <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {destinationDetails.map((destination) => (
              <Card key={destination.country} className="rounded-lg border-slate-200 bg-white shadow-sm">
                <CardContent className="p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#101b31] text-white">
                    <span className="text-3xl leading-none" aria-hidden="true">{destination.flag}</span>
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-bold text-[#07162f]">{destination.country}</h3>
                  <div className="mt-6 space-y-4 text-sm text-slate-600">
                    <div className="flex justify-between gap-4 border-t pt-4">
                      <span className="font-semibold text-slate-500">Intakes</span>
                      <span className="text-right font-bold text-slate-900">{destination.intake}</span>
                    </div>
                    <div className="flex justify-between gap-4 border-t pt-4">
                      <span className="font-semibold text-slate-500">Tuition</span>
                      <span className="text-right font-bold text-slate-900">{destination.tuition}</span>
                    </div>
                    <div className="border-t pt-4">
                      <span className="font-semibold text-slate-500">Best For</span>
                      <p className="mt-2 font-semibold leading-6 text-slate-900">{destination.strength}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {intakeTimeline.length > 0 && (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="modern-kicker">Intake Timeline</div>
                <h2 className="mt-5 font-serif text-4xl font-bold text-[#07162f] md:text-5xl">Plan your application around the right intake.</h2>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  Use these target windows as a starting point. Final deadlines change by country, university, and course.
                </p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {intakeTimeline.map((item) => (
                <Card key={`${item.intake}-${item.deadline}`} className="rounded-lg border-slate-200 bg-[#f8fbff] shadow-sm">
                  <CardContent className="p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#d9a31a] text-[#081120]">
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-bold text-[#07162f]">{item.intake}</h3>
                    <p className="mt-3 font-bold text-[#0e2f6d]">{item.deadline}</p>
                    <p className="mt-4 leading-7 text-slate-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="about" className="bg-[#101b31] py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-8">
          <div>
            <h2 className="font-serif text-4xl font-bold md:text-5xl">{content?.aboutTitle || "Built for serious study abroad decisions."}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              {content?.aboutText || "Our counseling process blends destination research, admission strategy, funding planning, and visa preparation into one guided path."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {aboutHighlights.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 p-5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#e4aa19]" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="bg-[#f4f7fb] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="font-serif text-4xl font-bold text-[#07162f] md:text-5xl">Student Success Stories</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Students choose NextStep for honest advice, thoughtful planning, and steady support through complex decisions.
              </p>
            </div>
            <div className="flex gap-1 text-[#e4aa19]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
            </div>
          </div>

          <div className="grid gap-7 md:grid-cols-3">
            {featuredTestimonials.map((testimonial) => (
              <div key={testimonial.id}>
                <Card className="h-full rounded-lg border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-8">
                    <Quote className="h-10 w-10 text-[#e4aa19]" />
                    <p className="mt-6 min-h-28 text-lg leading-8 text-slate-700">&quot;{testimonial.message}&quot;</p>
                    <div className="mt-8 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-[#101b31] font-bold text-white">
                        {testimonial.avatarUrl ? (
                          <img
                            src={assetUrl(testimonial.avatarUrl)}
                            alt={testimonial.studentName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          testimonial.studentName.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-serif text-xl font-bold text-[#07162f]">{testimonial.studentName}</div>
                        <div className="text-sm font-medium text-slate-500">
                          {testimonial.program ? `${testimonial.program}, ` : ""}{testimonial.country}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {galleryList.length > 0 && (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 className="font-serif text-4xl font-bold text-[#07162f] md:text-5xl">Life Abroad</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">A closer look at campuses, student events, and destination moments.</p>
          </div>
          <div className="mt-12 flex gap-5 overflow-x-auto px-5 pb-4 lg:px-8">
            {galleryList.map((img) => (
              <div key={img.id} className="relative h-[390px] min-w-[300px] overflow-hidden rounded-lg bg-slate-100">
                <img src={assetUrl(img.url)} alt={img.caption || ""} className="h-full w-full object-cover" />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-14">
                    <p className="font-semibold text-white">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="bg-[#f4f7fb] py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <div className="modern-kicker">FAQ</div>
              <h2 className="mt-5 font-serif text-4xl font-bold text-[#07162f] md:text-5xl">Common questions before applying.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                These answers help students prepare for the first counseling call with clearer expectations.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.question} className="rounded-lg border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-serif text-xl font-bold text-[#07162f]">{faq.question}</h3>
                    <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <h2 className="font-serif text-4xl font-bold text-[#07162f] md:text-5xl">{content?.contactTitle || "Ready to start your assessment?"}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {content?.contactText || "Book a free consultation and get a practical roadmap for destination selection, admissions, funding, and visa preparation."}
            </p>
            <div className="mt-10 space-y-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#101b31] text-white">
                  <UsersRound className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-2xl font-bold text-[#07162f]">Dedicated Counselor</h4>
                  <p className="mt-2 leading-7 text-slate-600">Work with one advisor who understands your goals and keeps your plan organized.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#101b31] text-white">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-2xl font-bold text-[#07162f]">Destination Planning</h4>
                  <p className="mt-2 leading-7 text-slate-600">Compare countries, universities, costs, timelines, and outcomes before you commit.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-[#f4f7fb] p-6 shadow-sm md:p-9">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-7 w-7 text-[#101b31]" />
                <h3 className="font-serif text-3xl font-bold text-[#07162f]">Book Consultation</h3>
              </div>
              <Form {...appointmentForm}>
                <form onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)} className="mt-7 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField control={appointmentForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input className="bg-white" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={appointmentForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input className="bg-white" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={appointmentForm.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input className="bg-white" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={appointmentForm.control} name="destination" render={({ field }) => (
                      <FormItem><FormLabel>Preferred Destination</FormLabel><FormControl><Input className="bg-white" placeholder="Canada, UK, Australia..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={appointmentForm.control} name="preferredDate" render={({ field }) => (
                      <FormItem><FormLabel>Preferred Date</FormLabel><FormControl><Input type="date" className="bg-white" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={appointmentForm.control} name="preferredTime" render={({ field }) => (
                      <FormItem><FormLabel>Preferred Time</FormLabel><FormControl><Input type="time" className="bg-white" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={appointmentForm.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea className="bg-white" rows={3} placeholder="Tell us what you want to discuss..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-14 w-full rounded-md border border-[#121d32] bg-[#e4aa19] text-lg font-semibold text-black shadow-none hover:bg-[#d89e12]"
                    disabled={appointmentForm.formState.isSubmitting}
                  >
                    {appointmentForm.formState.isSubmitting ? "Requesting..." : "Request Appointment"}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#f4f7fb] p-6 shadow-sm md:p-9">
              <h3 className="font-serif text-3xl font-bold text-[#07162f]">Request a Callback</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input className="bg-white" placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input className="bg-white" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input className="bg-white" placeholder="+91 98765 43210" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="whatsapp" render={({ field }) => (
                    <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input className="bg-white" placeholder="+91 98765 43210" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Interested Destination</FormLabel><FormControl><Input className="bg-white" placeholder="Masters in Canada" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea className="bg-white" placeholder="Tell us about your background and goals..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-md border border-[#121d32] bg-[#e4aa19] text-lg font-semibold text-black shadow-none hover:bg-[#d89e12]"
                  disabled={createInquiry.isPending}
                >
                  {createInquiry.isPending ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </form>
            </Form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#101b31] py-12 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src={withBasePath("/nextstep-logo.png")}
                alt="NextStep Global Educational Services"
                className="h-14 w-auto rounded-xl bg-white p-1.5 object-contain"
              />
            </div>
            <p className="mt-5 max-w-md leading-7">{content?.footerTagline || "Global education guidance shaped by mentorship, clarity, and long-term student outcomes."}</p>
            <div className="mt-6 text-sm">(c) {new Date().getFullYear()} NextStep. All rights reserved.</div>
          </div>
          <div>
            <h4 className="font-serif text-xl font-bold text-white">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-white">Services</Link></li>
              <li><Link href="/destinations" className="hover:text-white">Destinations</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/sign-in" className="hover:text-white">Student Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-xl font-bold text-white">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>{content?.contactEmail || "info@nextstepglobal.edu"}</li>
              <li>{content?.contactPhone || "+91 1800 123 4567"}</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
