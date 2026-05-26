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
import { withBasePath } from "@/lib/runtime";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Globe2,
  GraduationCap,
  HandHeart,
  MapPin,
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

  const featuredPrograms = programsList.filter((p) => p.featured) || programsList.slice(0, 3) || [];
  const featuredTestimonials = testimonialsList.filter((t) => t.featured) || testimonialsList.slice(0, 3) || [];
  const metrics = Array.isArray(content?.metrics) ? content.metrics : [];
  const serviceIcons = [HandHeart, Globe2, ShieldCheck];
  const services = Array.isArray(content?.services) ? content.services : [];
  const aboutHighlights = Array.isArray(content?.aboutHighlights) && content.aboutHighlights.length
    ? content.aboutHighlights
    : ["Course shortlisting", "Scholarship strategy", "Visa documentation", "Pre-departure briefing"];

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
            <p className="mt-8 max-w-2xl text-xl leading-8 text-white md:text-2xl">
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

      <section id="programs" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="font-serif text-4xl font-bold text-[#07162f] md:text-5xl">Featured Destinations</h2>
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

          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {featuredPrograms.map((prog, idx) => (
              <div key={prog.id}>
                <Card className="h-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    {prog.imageUrl ? (
                      <img
                        src={prog.imageUrl}
                        alt={prog.title}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[#101b31]">
                        <Globe2 className="h-12 w-12 opacity-30" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 rounded-md bg-white px-3 py-1 text-sm font-bold uppercase text-[#101b31]">
                      {prog.country}
                    </div>
                  </div>
                  <CardContent className="p-7">
                    <h3 className="font-serif text-2xl font-bold text-[#07162f]">{prog.title}</h3>
                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <GraduationCap className="h-4 w-4" /> {prog.duration}
                    </div>
                    <p className="mt-5 line-clamp-3 leading-7 text-slate-600">{prog.description}</p>
                    <Button
                      variant="outline"
                      className="mt-7 h-11 w-full rounded-md border-slate-300 font-semibold text-[#101b31] hover:bg-[#101b31] hover:text-white"
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

      <section id="about" className="bg-[#101b31] py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-8">
          <div>
            <h2 className="font-serif text-4xl font-bold md:text-5xl">{content?.aboutTitle || "Built for serious study abroad decisions."}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              {content?.aboutText || "Our counseling process blends destination research, admission strategy, scholarship planning, and visa preparation into one guided path."}
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
            {featuredTestimonials.map((testimonial, idx) => (
              <div key={testimonial.id}>
                <Card className="h-full rounded-lg border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-8">
                    <Quote className="h-10 w-10 text-[#e4aa19]" />
                    <p className="mt-6 min-h-28 text-lg leading-8 text-slate-700">&quot;{testimonial.message}&quot;</p>
                    <div className="mt-8 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-[#101b31] font-bold text-white">
                        {testimonial.avatarUrl ? (
                          <img
                            src={testimonial.avatarUrl}
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
                <img src={img.url} alt={img.caption || ""} className="h-full w-full object-cover" />
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

      <section id="contact" className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <h2 className="font-serif text-4xl font-bold text-[#07162f] md:text-5xl">{content?.contactTitle || "Ready to start your assessment?"}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {content?.contactText || "Book a free consultation and get a practical roadmap for destination selection, admissions, scholarships, and visa preparation."}
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
                src={withBasePath("/nextstep-wordmark.png")}
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
