import { UsersRound, MapPin, CalendarDays } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateInquiry } from "@workspace/api-client-react";
import { createAppointment, getSiteContent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

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

export default function ContactPage() {
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

  return (
    <div className="min-h-screen bg-white text-[#0f1b2f]">
      <PublicHeader active="contact" />

      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h1 className="max-w-4xl font-serif text-5xl font-bold text-[#07162f] md:text-6xl">
            {content?.contactTitle || "Ready to start your assessment?"}
          </h1>
          <p className="mt-6 max-w-4xl text-xl leading-8 text-slate-600">
            {content?.contactText || "Book a free consultation and get a practical roadmap for destination selection, admissions, scholarships, and visa preparation."}
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#101b31] text-white">
                  <UsersRound className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#07162f]">Dedicated Counselor</h2>
                  <p className="mt-2 leading-7 text-slate-600">Work with one advisor who understands your goals and keeps your plan organized.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#101b31] text-white">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#07162f]">Destination Planning</h2>
                  <p className="mt-2 leading-7 text-slate-600">Compare countries, universities, costs, timelines, and outcomes before you commit.</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-[#f4f7fb] p-6 shadow-sm">
                <h3 className="font-serif text-2xl font-bold text-[#07162f]">Contact details</h3>
                <p className="mt-4 text-slate-600">Email: {content?.contactEmail || "info@nextstepglobal.edu"}</p>
                <p className="mt-2 text-slate-600">Phone: {content?.contactPhone || "+91 1800 123 4567"}</p>
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
                  <Button type="submit" size="lg" className="h-14 w-full rounded-md border border-[#121d32] bg-[#e4aa19] text-lg font-semibold text-black shadow-none hover:bg-[#d89e12]" disabled={appointmentForm.formState.isSubmitting}>
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
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input className="bg-white" type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input className="bg-white" placeholder="+91 ..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="whatsapp" render={({ field }) => (
                      <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input className="bg-white" placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem><FormLabel>Subject</FormLabel><FormControl><Input className="bg-white" placeholder="What do you need help with?" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea className="bg-white" rows={4} placeholder="Tell us about your plan..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" size="lg" className="h-14 w-full rounded-md border border-[#121d32] bg-[#101b31] text-lg font-semibold text-white shadow-none hover:bg-[#0b1427]" disabled={createInquiry.isPending}>
                    {createInquiry.isPending ? "Submitting..." : "Request Callback"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
