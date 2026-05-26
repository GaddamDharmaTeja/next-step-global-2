import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/layout/public-header";
import { listConsultants } from "@/lib/api";
import { withBasePath } from "@/lib/runtime";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Globe2, Languages, Sparkles, UsersRound } from "lucide-react";

export default function ConsultantsPage() {
  const { data: consultants } = useQuery({
    queryKey: ["/api/consultants"],
    queryFn: listConsultants,
  });
  const consultantsList = Array.isArray(consultants) ? consultants : [];
  const visibleConsultants = consultantsList.filter((consultant) => consultant.featured);

  return (
    <div className="modern-page-shell">
      <PublicHeader active="consultants" />

      <section className="relative overflow-hidden bg-[#101b31] text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-[#e4aa19]/30 blur-3xl" />
          <div className="absolute right-10 top-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#e4aa19]">
              <Sparkles className="h-4 w-4" />
              Expert Mentorship
            </div>
            <h1 className="mt-7 max-w-4xl font-serif text-5xl font-bold leading-tight md:text-7xl">
              Meet the mentors who shape your global plan.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-200">
              Work with counselors who understand admissions, visa strategy, scholarship planning, and the small profile details that change outcomes.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/#contact">
                <Button className="h-14 rounded-md border border-[#e4aa19] bg-[#e4aa19] px-8 text-lg font-semibold text-black hover:bg-[#d89e12]">
                  Book a Mentor Call <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/destinations">
                <Button variant="outline" className="h-14 rounded-md border-white/30 bg-white/5 px-8 text-lg font-semibold text-white hover:bg-white hover:text-[#101b31]">
                  Explore Destinations
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 self-end sm:grid-cols-3">
            {[
              { value: "1:1", label: "Counseling", icon: UsersRound },
              { value: "25+", label: "Countries", icon: Globe2 },
              { value: "98%", label: "Visa Success", icon: BadgeCheck },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <Icon className="h-6 w-6 text-[#e4aa19]" />
                  <div className="mt-5 font-serif text-4xl font-bold">{stat.value}</div>
                  <div className="mt-1 text-sm font-semibold uppercase tracking-[0.15em] text-slate-300">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h2 className="font-serif text-4xl font-bold text-[#07162f]">Your Advisory Team</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Each mentor card is editable from admin, so you can update photos, specialties, languages, and destination expertise anytime.
          </p>
        </div>

        <div className="grid gap-7 lg:grid-cols-3">
          {visibleConsultants.map((consultant) => (
            <Card key={consultant.id} className="group overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-80 overflow-hidden bg-slate-200">
                {consultant.imageUrl ? (
                  <img src={consultant.imageUrl} alt={consultant.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-6xl font-serif font-bold text-slate-400">
                    {consultant.name.slice(0, 1)}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101b31] to-transparent p-5 pt-20">
                  <div className="inline-flex rounded-full bg-[#e4aa19] px-3 py-1 text-sm font-bold text-black">{consultant.experience} Experience</div>
                </div>
              </div>
              <CardContent className="p-7">
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#e4aa19]">{consultant.specialty}</div>
                <h3 className="mt-3 font-serif text-3xl font-bold text-[#07162f]">{consultant.name}</h3>
                <p className="mt-1 font-semibold text-slate-600">{consultant.role}</p>
                <p className="mt-5 min-h-24 text-base leading-7 text-slate-600">{consultant.bio}</p>

                <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                  <div className="flex gap-3 text-sm text-slate-600">
                    <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-[#101b31]" />
                    <span>{consultant.countries.join(", ") || "Multiple destinations"}</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-600">
                    <Languages className="mt-0.5 h-5 w-5 shrink-0 text-[#101b31]" />
                    <span>{consultant.languages.join(", ") || "English"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="font-serif text-4xl font-bold text-[#07162f]">Not sure who to speak with?</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Send your profile once. We will match you with the right mentor based on destination, budget, intake, and study goal.
            </p>
          </div>
          <Link href="/#contact">
            <Button className="h-14 rounded-md bg-[#101b31] px-8 text-lg font-semibold text-white hover:bg-[#172846]">
              Get Matched
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
