import { useState } from "react";
import { useGetMyProfile, useListPrograms } from "@workspace/api-client-react";
import { Link, Redirect, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGetMyProfileQueryKey } from "@workspace/api-client-react";
import {
  createAppointment,
  getRoleMenuAccess,
  listConsultants,
  listDocumentChecklists,
  listMyInquiries,
  listMyStudentDocuments,
  signOut,
  uploadStudentDocument,
} from "@/lib/api";
import { assetUrl } from "@/lib/runtime";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUpRight,
  BellRing,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Globe2,
  GraduationCap,
  ListChecks,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

type MeetingType = "phone" | "video" | "office";

function getStatusClasses(status: "pending" | "contacted" | "resolved") {
  if (status === "resolved") {
    return "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "contacted") {
    return "bg-amber-500/10 text-amber-700 ring-1 ring-amber-200";
  }

  return "bg-sky-500/10 text-sky-700 ring-1 ring-sky-200";
}

const applicationSteps = [
  { key: "profile", label: "Profile review", stages: ["new", "contacted"] },
  { key: "counseling", label: "Counseling", stages: ["counseling"] },
  { key: "documents", label: "Documents", stages: ["documents"] },
  { key: "applied", label: "Applications", stages: ["applied"] },
  { key: "offer", label: "Offer", stages: ["offer"] },
  { key: "visa", label: "Visa", stages: ["visa"] },
  { key: "departure", label: "Enrolled", stages: ["enrolled"] },
];

function activeStage(inquiries: Awaited<ReturnType<typeof listMyInquiries>>) {
  const latest = [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return latest?.leadStage || (latest?.status === "resolved" ? "enrolled" : latest?.status === "contacted" ? "contacted" : "new");
}

function checklistFor(inquiries: Awaited<ReturnType<typeof listMyInquiries>>) {
  const text = inquiries.map((entry) => `${entry.subject} ${entry.message}`).join(" ").toLowerCase();
  if (text.includes("canada")) return ["Passport", "Academic transcripts", "IELTS/PTE score", "GIC or financial proof", "Statement of purpose"];
  if (text.includes("uk") || text.includes("united kingdom")) return ["Passport", "CAS documents", "Academic transcripts", "Financial evidence", "TB test if applicable"];
  if (text.includes("australia")) return ["Passport", "Academic transcripts", "Genuine student documents", "OSHC", "Financial evidence"];
  if (text.includes("usa") || text.includes("united states")) return ["Passport", "I-20 documents", "Academic transcripts", "SEVIS fee", "Financial sponsor proof"];
  return ["Passport", "Academic transcripts", "English test score", "Statement of purpose", "Financial documents"];
}

export default function UserPortalPage() {
  const { data: profile, isLoading } = useGetMyProfile();
  const { data: programs } = useListPrograms();
  const { data: inquiries } = useQuery({
    queryKey: ["/api/inquiries/mine"],
    queryFn: listMyInquiries,
    enabled: Boolean(profile),
  });
  const { data: documents } = useQuery({
    queryKey: ["/api/student-documents/mine"],
    queryFn: listMyStudentDocuments,
    enabled: Boolean(profile),
  });
  const { data: consultants = [] } = useQuery({ queryKey: ["/api/consultants"], queryFn: listConsultants, enabled: Boolean(profile) });
  const { data: contentAccess } = useQuery({
    queryKey: ["/api/role-menu-access"],
    queryFn: getRoleMenuAccess,
    enabled: Boolean(profile),
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [appointmentForm, setAppointmentForm] = useState({
    destination: "",
    consultantId: "",
    preferredDate: "",
    preferredTime: "",
    meetingType: "phone" as MeetingType,
    notes: "",
  });
  const [selectedChecklistItemId, setSelectedChecklistItemId] = useState("");
  const myInquiries = Array.isArray(inquiries) ? inquiries : [];
  const latestInquiry = [...myInquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const { data: checklistTemplates = [] } = useQuery({
    queryKey: ["/api/document-checklists", latestInquiry?.destination, latestInquiry?.programLevel],
    queryFn: () => listDocumentChecklists({ destination: latestInquiry?.destination || undefined, level: latestInquiry?.programLevel || undefined }),
    enabled: Boolean(profile),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  if (!profile) {
    return <Redirect to="/sign-in" />;
  }

  if (profile.role === "admin" || profile.role === "manager" || profile.role === "owner") {
    return <Redirect to="/admin" />;
  }

  const displayedPrograms = Array.isArray(programs) ? programs.slice(0, 4) : [];
  const documentList = Array.isArray(documents) ? documents : [];
  const firstName = profile.name?.trim().split(/\s+/)[0] || "Student";
  const pendingCount = myInquiries.filter((entry) => entry.status === "pending").length;
  const currentStage = activeStage(myInquiries);
  const documentChecklist = checklistTemplates[0]?.items.map((item) => item.label) || checklistFor(myInquiries);
  const checklistItems = checklistTemplates[0]?.items || documentChecklist.map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label, required: true }));
  const visibleSections = contentAccess?.userPortal || ["hero", "profile", "inquiries", "programs", "documents"];
  const canSee = (section: string) => visibleSections.includes(section);
  const readinessScore = latestInquiry?.visaReadinessScore ?? 10;

  const handleSignOut = async () => {
    try {
      await signOut();
      await queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      setLocation("/sign-in");
    } catch {
      toast({ title: "Failed to sign out", variant: "destructive" });
    }
  };

  const handleDocumentUpload = async (file: File | null) => {
    if (!file) return;
    try {
      await uploadStudentDocument({ file, checklistItemId: selectedChecklistItemId || null, documentType: checklistItems.find((item) => item.id === selectedChecklistItemId)?.label || null });
      await queryClient.invalidateQueries({ queryKey: ["/api/student-documents/mine"] });
      toast({ title: "Document uploaded" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to upload document", variant: "destructive" });
    }
  };

  const handleBookAppointment = async () => {
    try {
      await createAppointment({
        name: profile.name || firstName,
        email: profile.email,
        phone: profile.phone || "Not provided",
        destination: appointmentForm.destination,
        consultantId: appointmentForm.consultantId ? Number(appointmentForm.consultantId) : null,
        meetingType: appointmentForm.meetingType,
        preferredDate: appointmentForm.preferredDate,
        preferredTime: appointmentForm.preferredTime,
        notes: appointmentForm.notes,
      });
      setAppointmentForm({ destination: "", consultantId: "", preferredDate: "", preferredTime: "", meetingType: "phone", notes: "" });
      toast({ title: "Consultation requested" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to request appointment", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,47,109,0.16),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(217,163,26,0.16),_transparent_20%),linear-gradient(180deg,_#fdfcf7_0%,_#eef4ff_42%,_#f7fafc_100%)] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo
              frameClassName="flex h-[58px] items-center rounded-2xl bg-white px-3 shadow-lg shadow-slate-900/10"
              imageClassName="h-10 w-auto max-w-[170px] object-contain"
            />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a77400]">Student Portal</div>
              <div className="text-2xl font-semibold tracking-tight text-slate-900">NextStep</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="rounded-full px-4 text-slate-700 hover:bg-slate-100">
                Back to Home
              </Button>
            </Link>
            <Button
              variant="outline"
              className="rounded-full border-slate-300 bg-white/80 px-5 shadow-sm"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {canSee("hero") && (
        <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(8,17,32,0.97)_0%,rgba(14,47,109,0.94)_48%,rgba(24,69,141,0.9)_100%)] px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8 lg:px-10">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#e0b43b]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#9bbcf1]/15 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.6fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-slate-100/90 backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Your global education journey, organized in one place
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Welcome back, {firstName}.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                  Track your consultation progress, revisit recommended programs, and keep your NextStep application journey moving with confidence.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#programs"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                >
                  Explore Programs
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <Link
                  href="/user-portal/chat"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Open Chat
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Inquiries submitted</div>
                <div className="mt-3 text-3xl font-semibold">{myInquiries.length}</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Awaiting response</div>
                <div className="mt-3 text-3xl font-semibold">{pendingCount}</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Recommended tracks</div>
                <div className="mt-3 text-3xl font-semibold">{displayedPrograms.length}</div>
              </div>
            </div>
          </div>
        </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          {canSee("profile") && (
          <Card className="overflow-hidden rounded-[1.75rem] border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(245,158,11,0.08))] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Profile</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Personal Snapshot</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
                  <UserRound className="h-7 w-7" />
                </div>
              </div>
            </div>

            <CardContent className="space-y-5 p-6">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Member</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{profile.name || "Profile pending"}</div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
                  <Mail className="mt-0.5 h-5 w-5 text-sky-700" />
                  <div>
                    <div className="text-sm font-medium text-slate-500">Email</div>
                    <div className="text-sm font-semibold text-slate-900 break-all">{profile.email}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
                  <Phone className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-500">Phone</div>
                    <div className="text-sm font-semibold text-slate-900">{profile.phone || "Not added yet"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
                  <Globe2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-500">Portal access</div>
                    <div className="text-sm font-semibold capitalize text-slate-900">{profile.role}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          <div className="space-y-6">
            {canSee("inquiries") && (
              <Card className="rounded-[1.75rem] border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex items-center justify-between border-b border-slate-200/80 p-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a77400]">Application Timeline</div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Your NextStep Roadmap</h2>
                  </div>
                  <ListChecks className="h-7 w-7 text-[#0e2f6d]" />
                </div>
                <CardContent className="grid gap-3 p-6 md:grid-cols-6">
                  {applicationSteps.map((step, index) => {
                    const isActive = step.stages.includes(currentStage);
                    const isDone = applicationSteps.findIndex((item) => item.stages.includes(currentStage)) > index;
                    return (
                      <div key={step.key} className={`rounded-2xl border p-4 ${isActive ? "border-[#d9a31a] bg-amber-50" : isDone ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                        <div className="text-xs font-bold text-slate-500">0{index + 1}</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{step.label}</div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {canSee("documents") && (
              <Card className="rounded-[1.75rem] border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="border-b border-slate-200/80 p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Country Checklist</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Suggested Documents</h2>
                  <p className="mt-2 text-sm text-slate-600">This checklist adapts from your inquiry destination when possible.</p>
                </div>
                <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
                  {checklistItems.map((item) => {
                    const matched = documentList.find((doc) => doc.checklistItemId === item.id || doc.documentType === item.label);
                    return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <span>{item.label}</span>
                        <span className={`rounded-full px-2 py-1 text-xs ${matched?.status === "approved" ? "bg-emerald-100 text-emerald-700" : matched ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {matched?.status || (item.required ? "required" : "optional")}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
                    <div className="text-sm font-semibold text-slate-900">Visa readiness</div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#0e2f6d,#d9a31a)]" style={{ width: `${readinessScore}%` }} />
                    </div>
                    <div className="mt-2 text-sm text-slate-600">{readinessScore}% ready based on your current stage and approved uploads.</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {canSee("appointments") && (
              <Card className="rounded-[1.75rem] border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="border-b border-slate-200/80 p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Consultation Booking</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Book a counselor session</h2>
                </div>
                <CardContent className="grid gap-3 p-6 md:grid-cols-2">
                  <Input value={appointmentForm.destination} onChange={(e) => setAppointmentForm({ ...appointmentForm, destination: e.target.value })} placeholder="Destination" />
                  <Select value={appointmentForm.consultantId || "none"} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, consultantId: value === "none" ? "" : value })}>
                    <SelectTrigger><SelectValue placeholder="Preferred consultant" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any consultant</SelectItem>
                      {consultants.map((consultant) => <SelectItem key={consultant.id} value={String(consultant.id)}>{consultant.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={appointmentForm.preferredDate} onChange={(e) => setAppointmentForm({ ...appointmentForm, preferredDate: e.target.value })} />
                  <Input type="time" value={appointmentForm.preferredTime} onChange={(e) => setAppointmentForm({ ...appointmentForm, preferredTime: e.target.value })} />
                  <Select value={appointmentForm.meetingType} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, meetingType: value as "phone" | "video" | "office" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone call</SelectItem>
                      <SelectItem value="video">Video meeting</SelectItem>
                      <SelectItem value="office">Office visit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} placeholder="Notes" />
                  <Button className="md:col-span-2" onClick={handleBookAppointment}>Request appointment</Button>
                </CardContent>
              </Card>
            )}

            {canSee("messages") && (
              <Card className="rounded-[1.75rem] border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 p-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">Messages</div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Counselor chat</h2>
                    <p className="mt-2 text-sm text-slate-600">Chat history is grouped by inquiry on its own page.</p>
                  </div>
                  <Link href="/user-portal/chat">
                    <Button className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Open Chat
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {canSee("inquiries") && (
            <Card
              id="inquiries"
              className="rounded-[1.75rem] border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 p-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Consultations</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">My Inquiries</h2>
                  <p className="mt-2 text-sm text-slate-600">A live view of your conversations and current status.</p>
                </div>
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 sm:flex">
                  <BellRing className="h-7 w-7" />
                </div>
              </div>

              <CardContent className="p-6">
                {myInquiries.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-[linear-gradient(135deg,#f8fbff_0%,#f8fafc_100%)] px-6 py-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <CalendarDays className="h-8 w-8 text-sky-700" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-slate-900">No inquiries yet</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                      Once you submit a consultation request, you&apos;ll see its progress here with clear status updates.
                    </p>
                    <Link href="/">
                      <Button className="mt-6 rounded-full px-5">Start a Consultation</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myInquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="group rounded-[1.5rem] border border-slate-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              <BookOpen className="h-3.5 w-3.5" />
                              Inquiry #{inq.id}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">{inq.subject}</h3>
                            <p className="text-sm leading-6 text-slate-600">{inq.message}</p>
                            <div className="text-xs font-medium text-slate-500">
                              Submitted on {new Date(inq.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div
                            className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${getStatusClasses(inq.status)}`}
                          >
                            {inq.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {canSee("programs") && (
            <Card
              id="programs"
              className="rounded-[1.75rem] border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 p-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Discover</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Recommended Programs</h2>
                  <p className="mt-2 text-sm text-slate-600">Curated options aligned with popular study destinations.</p>
                </div>
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 sm:flex">
                  <GraduationCap className="h-7 w-7" />
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  {displayedPrograms.map((prog) => (
                    <div
                      key={prog.id}
                      className="group overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        {prog.imageUrl ? (
                          <img
                            src={assetUrl(prog.imageUrl)}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            alt={prog.title}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_100%)] text-slate-500">
                            Program image coming soon
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent" />
                        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-800">
                          {prog.country}
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        <div>
                          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{prog.title}</h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{prog.description}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                            {prog.duration}
                          </div>
                          <Link href="/">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:gap-3">
                              Learn more
                              <ChevronRight className="h-4 w-4" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {canSee("documents") && (
            <Card className="rounded-[1.75rem] border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-200/80 p-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Documents</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">My Uploads</h2>
                  <p className="mt-2 text-sm text-slate-600">Upload transcripts, SOPs, and supporting files for review.</p>
                </div>
                <div className="grid max-w-[320px] gap-2">
                  <Select value={selectedChecklistItemId || "none"} onValueChange={(value) => setSelectedChecklistItemId(value === "none" ? "" : value)}>
                    <SelectTrigger><SelectValue placeholder="Match checklist item" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General upload</SelectItem>
                      {checklistItems.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload(e.target.files?.[0] || null)} />
                </div>
              </div>
              <CardContent className="space-y-3 p-6">
                {documentList.length === 0 && <div className="text-sm text-slate-600">No documents uploaded yet.</div>}
                {documentList.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4">
                    <div>
                      <div className="font-medium text-slate-900">{doc.fileName}</div>
                      <div className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold capitalize text-slate-900">{doc.status}</div>
                      {doc.note && <div className="text-xs text-slate-500">{doc.note}</div>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            )}
          </div>
        </section>
      </main>

      {canSee("messages") && (
        <Link href="/user-portal/chat">
          <button
            type="button"
            className="fixed bottom-5 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[#0e2f6d] text-white shadow-[0_18px_40px_rgba(14,47,109,0.35)] transition hover:-translate-y-0.5 hover:bg-[#17458d]"
            aria-label="Open chat page"
          >
            <MessageCircle className="h-7 w-7" />
          </button>
        </Link>
      )}
    </div>
  );
}
