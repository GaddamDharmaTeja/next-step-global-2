import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/layout/public-header";
import { listDestinations } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Landmark,
  Plane,
  Search,
  ShieldCheck,
} from "lucide-react";

export default function DestinationsPage() {
  const { data: destinations } = useQuery({
    queryKey: ["/api/destinations"],
    queryFn: listDestinations,
  });
  const destinationsList = Array.isArray(destinations) ? destinations : [];
  const visibleDestinations = destinationsList.filter((destination) => destination.featured);

  return (
    <div className="modern-page-shell">
      <PublicHeader active="destinations" />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase text-slate-600">
              <Plane className="h-4 w-4 text-[#e4aa19]" />
              Study Destinations
            </div>
            <h1 className="mt-7 font-serif text-5xl font-bold leading-tight text-[#07162f] md:text-6xl">
              Choose the country that fits your future.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
              Compare top study destinations by visa options, tuition range, university strength, and long-term career pathways.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:self-end">
            {[
              { icon: Landmark, value: "25+", label: "Countries" },
              { icon: GraduationCap, value: "500+", label: "University Options" },
              { icon: ShieldCheck, value: "98%", label: "Visa Success" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-[#f4f7fb] p-5">
                  <Icon className="h-6 w-6 text-[#101b31]" />
                  <div className="mt-4 font-serif text-4xl font-bold text-[#07162f]">{stat.value}</div>
                  <div className="mt-1 text-sm font-semibold uppercase text-slate-500">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2 className="font-serif text-4xl font-bold text-[#07162f]">Destination Guide</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Each destination has different strengths. Use these cards as a starting point before your assessment call.
            </p>
          </div>
          <div className="flex h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-4 text-slate-500 shadow-sm">
            <Search className="h-5 w-5" />
            <span className="text-sm font-medium">Personal shortlist during consultation</span>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-3">
          {visibleDestinations.map((destination) => (
            <Card
              key={destination.code}
              className="flex h-full overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex w-full flex-col">
                <div className={`border-b border-slate-200 bg-gradient-to-br ${destination.accent} p-8`}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white font-serif text-2xl font-bold text-[#07162f] shadow-sm">
                      {destination.code}
                    </div>
                    <h3 className="font-serif text-3xl font-bold leading-tight text-[#07162f]">{destination.name}</h3>
                  </div>
                  <p className="mt-5 line-clamp-3 text-lg leading-7 text-slate-600">{destination.description}</p>
                </div>

                <CardContent className="flex flex-1 flex-col p-8">
                  <div>
                    <div className="flex items-center gap-3 font-serif text-lg font-bold uppercase text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-[#101b31]" />
                      Key Highlights
                    </div>
                    <ul className="mt-4 space-y-3 text-base leading-7 text-slate-900">
                      {destination.highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-3">
                          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#101b31]" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 space-y-7">
                    <div>
                      <div className="flex items-center gap-3 font-serif text-lg font-bold uppercase text-slate-600">
                        <GraduationCap className="h-5 w-5 text-[#101b31]" />
                        Top Universities
                      </div>
                      <p className="mt-3 leading-7 text-slate-900">{destination.universities.join(" ")}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 font-serif text-lg font-bold uppercase text-slate-600">
                        <BadgeDollarSign className="h-5 w-5 text-[#101b31]" />
                        Avg. Tuition
                      </div>
                      <p className="mt-3 font-semibold text-slate-900">{destination.tuition}</p>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-200 pt-6">
                    <Link href={`/destinations/${destination.slug}`}>
                      <Button className="h-12 w-full rounded-md bg-[#101b31] text-base font-semibold text-white shadow-none hover:bg-[#172846]">
                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/#contact">
                      <Button
                        variant="outline"
                        className="h-12 w-full rounded-md border-[#101b31] text-base font-semibold text-[#101b31] hover:bg-[#101b31] hover:text-white"
                      >
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[#101b31] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="font-serif text-4xl font-bold">Need help choosing?</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
              A counselor can compare destinations against your budget, profile, preferred intake, and career target.
            </p>
          </div>
          <Link href="/#contact">
            <Button className="h-14 rounded-md border border-[#e4aa19] bg-[#e4aa19] px-8 text-lg font-semibold text-black shadow-none hover:bg-[#d89e12]">
              Book Free Assessment <BookOpenCheck className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
