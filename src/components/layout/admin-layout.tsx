import { Link, Redirect, useLocation } from "wouter";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Crown,
  FileText,
  GraduationCap,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Map,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useGetMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { BrandLogo } from "./brand-logo";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useGetMyProfile({
    query: { retry: false, refetchOnWindowFocus: false } as any,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return <Redirect to="/sign-in" />;
  }

  if (profile.role !== "admin" && profile.role !== "owner") {
    return <Redirect to="/user-portal" />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      await queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      setLocation("/sign-in");
    } catch {
      toast({ title: "Failed to sign out", variant: "destructive" });
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Site Content", href: "/admin/content", icon: FileText },
    { label: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
    { label: "Pipeline", href: "/admin/pipeline", icon: LayoutDashboard },
    { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
    { label: "Consultants", href: "/admin/consultants", icon: Users },
    { label: "Programs", href: "/admin/programs", icon: GraduationCap },
    { label: "Destinations", href: "/admin/destinations", icon: Map },
    { label: "Gallery", href: "/admin/gallery", icon: ImageIcon },
    { label: "Testimonials", href: "/admin/testimonials", icon: MessageCircle },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
    { label: "Documents", href: "/admin/documents", icon: FileText },
  ];

  if (profile.role === "owner") {
    navItems.push(
      { label: "Owner Settings", href: "/admin/settings", icon: FileText },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
    );
  }

  const roleTone =
    profile.role === "owner"
      ? "bg-[#d9a31a]/18 text-[#f7d36b] ring-1 ring-[#e3bc57]/25"
      : "bg-[#173f86]/30 text-[#d8e7ff] ring-1 ring-[#9ab8ef]/20";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,47,109,0.10),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(217,163,26,0.14),_transparent_18%),linear-gradient(180deg,_#fdfbf5_0%,_#f5f8ff_42%,_#f9fafc_100%)] text-slate-950 lg:flex">
      <aside className="flex w-full shrink-0 flex-col overflow-hidden border-b border-white/50 bg-[linear-gradient(180deg,#09172f_0%,#0e2f6d_55%,#17458d_100%)] text-primary-foreground shadow-[0_25px_80px_rgba(15,23,42,0.18)] lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r lg:border-r-white/10">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f0d28c]">
                Control Center
              </div>
              <div className="mt-3">
                <BrandLogo
                  frameClassName="flex h-[84px] items-center rounded-2xl bg-white px-3 shadow-[0_12px_32px_rgba(8,17,32,0.25)]"
                  imageClassName="h-16 w-auto max-w-[220px] object-contain"
                />
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-[#f0d28c]">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-300">Signed in as</div>
                <div className="mt-2 text-lg font-semibold text-white">{profile.name || "Admin User"}</div>
                <div className="mt-1 break-all text-sm text-slate-300">{profile.email}</div>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${roleTone}`}>
                {profile.role === "owner" ? <Crown className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {profile.role}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <div className="rounded-xl bg-white/10 p-2 text-slate-200 transition group-hover:bg-white/15 group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="grid gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/15 hover:text-white"
            >
              <span className="inline-flex items-center gap-3">
                <Home className="h-4 w-4" />
                View live site
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="h-11 rounded-2xl border-white/15 bg-transparent text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a77400]">Operations</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Admin Portal</h1>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                {profile.email}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
