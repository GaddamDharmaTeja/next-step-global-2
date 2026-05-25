import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { HandHeart, Globe2, ShieldCheck, ArrowRight } from "lucide-react";
import { getSiteContent } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function ServicesPage() {
  const { data: content } = useQuery({ queryKey: ["/api/site-content"], queryFn: getSiteContent });
  const serviceIcons = [HandHeart, Globe2, ShieldCheck];
  const services = Array.isArray(content?.services) ? content.services : [];

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#0f1b2f]">
      <PublicHeader active="services" />

      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#fffdf7_0%,#eef4ff_100%)] py-22">
        <div className="mx-auto max-w-7xl px-5 text-center lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9a31a]/20 bg-[#d9a31a]/10 px-4 py-2 text-sm font-semibold text-[#a77400]">
            <HandHeart className="h-4 w-4" />
            NextStep Services
          </div>
          <h1 className="mt-6 font-serif text-5xl font-bold text-[#07162f] md:text-6xl">
            {content?.mentorshipTitle || "A Mentorship Approach"}
          </h1>
          <p className="mx-auto mt-6 max-w-4xl text-xl leading-8 text-slate-600">
            {content?.mentorshipSubtitle || "We go beyond the paperwork. Our advisors are deeply committed to understanding your aspirations and matching you with institutions where you will thrive."}
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-7 md:grid-cols-3">
            {services.map((service, index) => {
              const Icon = serviceIcons[index] || HandHeart;
              return (
                <div key={service.title}>
                  <Card className="h-full rounded-lg border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-10">
                      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-[#101b31]">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h2 className="mt-10 font-serif text-2xl font-bold text-[#07162f]">{service.title}</h2>
                      <p className="mt-6 text-lg leading-8 text-slate-600">{service.text}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          <div className="mt-16 rounded-2xl border border-slate-200 bg-[#101b31] p-10 text-white shadow-sm">
            <h3 className="font-serif text-3xl font-bold">Need help choosing the right service path?</h3>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
              Tell us your target destination, academic background, and timeline. We&apos;ll help you plan the right next step with a practical roadmap.
            </p>
            <Link href="/contact">
              <Button className="mt-8 h-12 rounded-md border border-[#d9a31a] bg-[#d9a31a] px-6 text-base font-semibold text-[#081120] shadow-none hover:bg-[#c79414]">
                Start Free Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
