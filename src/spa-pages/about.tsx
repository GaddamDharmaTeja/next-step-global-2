import { CheckCircle2, Globe2 } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { getSiteContent } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function AboutPage() {
  const { data: content } = useQuery({ queryKey: ["/api/site-content"], queryFn: getSiteContent });
  const metrics = Array.isArray(content?.metrics) ? content.metrics : [];
  const aboutHighlights = Array.isArray(content?.aboutHighlights) && content.aboutHighlights.length
    ? content.aboutHighlights
    : ["Course shortlisting", "Funding strategy", "Visa documentation", "Pre-departure briefing"];

  return (
    <div className="modern-page-shell">
      <PublicHeader active="about" />

      <section className="border-b border-slate-200 bg-white py-22">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#101b31]/10 bg-[#101b31]/5 px-4 py-2 text-sm font-semibold text-[#101b31]">
            <Globe2 className="h-4 w-4" />
            About NextStep
          </div>
          <h1 className="mt-6 max-w-4xl font-serif text-5xl font-bold text-[#07162f] md:text-6xl">
            {content?.aboutTitle || "Built for serious study abroad decisions."}
          </h1>
          <p className="mt-6 max-w-4xl text-xl leading-8 text-slate-600">
            {content?.aboutText || "Our counseling process blends destination research, admission strategy, funding planning, and visa preparation into one guided path."}
          </p>
        </div>
      </section>

      <section className="bg-[#101b31] py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-8">
          <div>
            <h2 className="font-serif text-4xl font-bold md:text-5xl">What we focus on</h2>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              We help students make calm, informed, long-term decisions across destination selection, university fit, funding strategy, and visa readiness.
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

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="font-serif text-5xl font-bold text-[#07162f]">{metric.value}</div>
                <div className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
