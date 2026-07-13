import { Link, Redirect, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/layout/public-header";
import { getDestination, listDestinations } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  FileText,
  Globe2,
  GraduationCap,
  Landmark,
  Timer,
} from "lucide-react";

export default function DestinationDetailPage() {
  const [, params] = useRoute("/destinations/:slug");
  const slug = params?.slug || "";
  const { data: destination, isLoading } = useQuery({
    queryKey: ["/api/destinations", slug],
    queryFn: () => getDestination(slug),
    enabled: Boolean(slug),
    retry: false,
  });
  const { data: destinations } = useQuery({
    queryKey: ["/api/destinations"],
    queryFn: listDestinations,
  });
  const destinationsList = Array.isArray(destinations) ? destinations : [];

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">Loading...</div>;
  }

  if (!destination) {
    return <Redirect to="/destinations" />;
  }

  const otherDestinations = destinationsList.filter((entry) => entry.slug !== destination.slug).slice(0, 3);

  return (
    <div className="modern-page-shell">
      <PublicHeader active="destinations" />

      <section className={`border-b border-slate-200 bg-gradient-to-br ${destination.accent}`}>
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-18">
          <Link href="/destinations" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#101b31]">
            <ArrowLeft className="h-4 w-4" />
            Back to destinations
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white font-serif text-3xl font-bold text-[#07162f] shadow-sm">
                  {destination.code}
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase text-slate-500">Study in</div>
                  <h1 className="font-serif text-5xl font-bold leading-tight text-[#07162f] md:text-6xl">
                    {destination.name}
                  </h1>
                </div>
              </div>
              <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-700">{destination.description}</p>
            </div>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-sm font-semibold uppercase text-slate-500">
                  <BadgeDollarSign className="h-5 w-5 text-[#101b31]" />
                  Tuition Costs
                </div>
                <div className="mt-5 text-3xl font-bold leading-tight text-[#07162f]">{destination.tuition}</div>
                <p className="mt-2 text-sm text-slate-500">Average per year</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-3">
              <Globe2 className="h-6 w-6 text-[#101b31]" />
              <h2 className="font-serif text-3xl font-bold text-[#07162f]">Overview</h2>
            </div>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{destination.overview}</p>
          </section>

          <section>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-[#101b31]" />
              <h2 className="font-serif text-3xl font-bold text-[#07162f]">Why Study in {destination.name}?</h2>
            </div>
            <div className="mt-6 grid gap-4">
              {destination.highlights.map((highlight) => (
                <div key={highlight} className="flex items-center gap-4 rounded-md bg-white/60 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#101b31]" />
                  <span className="text-lg text-slate-900">{highlight}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-[#101b31]" />
              <h2 className="font-serif text-3xl font-bold text-[#07162f]">Top Universities</h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {destination.universities.map((university) => (
                <span key={university} className="rounded-md bg-[#e4aa19] px-4 py-2 text-sm font-semibold text-black">
                  {university}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#101b31]" />
                <h2 className="font-serif text-3xl font-bold text-[#07162f]">Admission Requirements</h2>
              </div>
              <ul className="mt-5 space-y-3 text-lg leading-7 text-slate-700">
                {destination.requirements.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#101b31]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Timer className="h-6 w-6 text-[#101b31]" />
                <h2 className="font-serif text-3xl font-bold text-[#07162f]">Work Options</h2>
              </div>
              <ul className="mt-5 space-y-3 text-lg leading-7 text-slate-700">
                {destination.workOptions.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#101b31]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <Card className="rounded-lg border-slate-200 bg-[#101b31] text-white shadow-sm">
            <CardContent className="p-7 text-center">
              <h3 className="font-serif text-2xl font-bold">Ready to Apply?</h3>
              <p className="mt-4 leading-7 text-slate-200">
                Talk to one of our expert advisors about studying in {destination.name}.
              </p>
              <Link href="/#contact">
                <Button className="mt-6 h-12 w-full rounded-md bg-[#e4aa19] font-semibold text-black shadow-none hover:bg-[#d89e12]">
                  Book Free Consultation
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-serif text-xl font-bold text-[#07162f]">Explore More Destinations</h3>
              <div className="mt-5 space-y-3">
                {otherDestinations.map((entry) => (
                  <Link key={entry.slug} href={`/destinations/${entry.slug}`}>
                    <Button variant="outline" className="h-11 w-full justify-start rounded-md border-slate-300 text-[#101b31]">
                      <Landmark className="mr-2 h-4 w-4" />
                      {entry.name}
                    </Button>
                  </Link>
                ))}
              </div>
              <Link href="/destinations">
                <Button variant="outline" className="mt-4 h-11 w-full rounded-md border-[#101b31] text-[#101b31] hover:bg-[#101b31] hover:text-white">
                  View All Countries
                </Button>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
