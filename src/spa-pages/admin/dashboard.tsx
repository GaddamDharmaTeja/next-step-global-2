import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  CircleCheckBig,
  Crown,
  GraduationCap,
  ImageIcon,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";

const statCards = [
  {
    key: "totalUsers",
    label: "Total Users",
    accent: "from-[#173f86]/15 to-[#9bbcf1]/10",
    iconTone: "bg-[#173f86]/12 text-[#0e2f6d]",
    icon: Users,
  },
  {
    key: "totalInquiries",
    label: "Total Inquiries",
    accent: "from-amber-500/15 to-orange-500/10",
    iconTone: "bg-amber-500/15 text-amber-700",
    icon: MessageSquare,
  },
  {
    key: "totalPrograms",
    label: "Programs",
    accent: "from-[#0e2f6d]/12 to-[#d9a31a]/10",
    iconTone: "bg-[#d9a31a]/15 text-[#a77400]",
    icon: GraduationCap,
  },
  {
    key: "totalGalleryImages",
    label: "Gallery Images",
    accent: "from-[#d9a31a]/12 to-[#f2e4b7]/16",
    iconTone: "bg-[#d9a31a]/15 text-[#a77400]",
    icon: ImageIcon,
  },
] as const;

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(8,17,32,0.97)_0%,rgba(14,47,109,0.95)_48%,rgba(24,69,141,0.9)_100%)] px-6 py-7 text-white shadow-[0_25px_80px_rgba(15,23,42,0.12)] sm:px-8">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#e0b43b]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#9bbcf1]/15 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100/90">
                <Sparkles className="h-4 w-4 text-[#e0b43b]" />
                Modern operations dashboard
              </div>
              <h2 className="mt-6 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Command the NextStep workflow with clarity.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                See active student demand, monitor your pipeline, and manage platform growth from one calm, focused workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
              <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Pending inquiries</div>
                <div className="mt-3 text-3xl font-semibold">{stats?.pendingInquiries || 0}</div>
              </div>
              <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Recent activity</div>
                <div className="mt-3 text-3xl font-semibold">{stats?.recentInquiries?.length || 0}</div>
              </div>
              <div className="rounded-[1.4rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Leadership mode</div>
                <div className="mt-3 inline-flex items-center gap-2 text-lg font-semibold">
                  <Crown className="h-5 w-5 text-[#e0b43b]" />
                  Active
                </div>
              </div>
            </div>
          </div>
        </section>

        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h3>
          <p className="mt-2 text-slate-600">
            A quick snapshot of the student pipeline, content footprint, and platform usage.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const value = stats?.[card.key] || 0;
            return (
              <Card
                key={card.key}
                className="overflow-hidden rounded-[1.6rem] border-white/70 bg-[linear-gradient(135deg,white_0%,rgba(248,250,252,0.98)_100%)] shadow-[0_15px_45px_rgba(15,23,42,0.06)]"
              >
                <CardHeader className={`space-y-4 bg-gradient-to-br ${card.accent} pb-4`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-600">{card.label}</div>
                    <div className={`rounded-2xl p-3 ${card.iconTone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold tracking-tight text-slate-900">{value}</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="text-sm text-slate-500">
                    {card.key === "totalInquiries"
                      ? `${stats?.pendingInquiries || 0} still awaiting action`
                      : "Updated from the live operational store"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-200/70 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                    Recent Inquiries
                  </CardTitle>
                  <p className="mt-2 text-sm text-slate-600">
                    Most recent demand coming into your student counseling pipeline.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {stats?.recentInquiries?.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                  No recent inquiries.
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.recentInquiries?.map((inq) => (
                    <div
                      key={inq.id}
                      className="flex flex-col gap-4 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-2">
                        <p className="text-base font-semibold leading-none text-slate-900">{inq.name}</p>
                        <p className="text-sm text-slate-600">{inq.subject}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Inquiry #{inq.id}
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            inq.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : inq.status === "contacted"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-200/70 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                    Admin Priorities
                  </CardTitle>
                  <p className="mt-2 text-sm text-slate-600">
                    The next operational moves worth your attention today.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <CircleCheckBig className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="text-sm font-semibold text-slate-900">Follow up pending inquiries</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  You currently have {stats?.pendingInquiries || 0} inquiries still waiting for the next action.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="text-sm font-semibold text-slate-900">Refresh program highlights</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep destination and program highlights aligned with current student demand and featured countries.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="text-sm font-semibold text-slate-900">Review gallery and testimonials</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Social proof matters. Make sure the public-facing story matches your strongest student outcomes.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0e2f6d]">
                Open the relevant section from the sidebar
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
