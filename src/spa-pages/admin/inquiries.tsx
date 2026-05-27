import { AdminLayout } from "@/components/layout/admin-layout";
import { useListInquiries, useUpdateInquiry, useDeleteInquiry, getListInquiriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Mail, MessageCircle, Search, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { listNotificationTemplates, type NotificationTemplateRecord } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type InquiryStatus = "pending" | "contacted" | "resolved";
type StatusFilter = "all" | InquiryStatus;

type AdminInquiry = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  subject: string;
  message: string;
  status: InquiryStatus;
  leadStage?: string | null;
  assignedToName?: string | null;
  followUpAt?: string | null;
  createdAt: string;
};

const statusStyles: Record<InquiryStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  contacted: "border-blue-200 bg-blue-50 text-blue-800",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function daysSince(date: string) {
  const created = new Date(date).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 86400000));
}

function getPriority(inquiry: AdminInquiry) {
  let score = inquiry.status === "pending" ? 42 : inquiry.status === "contacted" ? 20 : 6;
  const age = daysSince(inquiry.createdAt);
  score += Math.min(age * 8, 38);
  if (inquiry.whatsapp || inquiry.phone) score += 10;
  if (/(urgent|visa|deadline|scholarship|intake|apply|admission)/i.test(`${inquiry.subject} ${inquiry.message}`)) score += 16;
  if (inquiry.followUpAt && new Date(inquiry.followUpAt).getTime() < Date.now()) score += 18;
  return Math.min(score, 100);
}

function priorityLabel(score: number) {
  if (score >= 70) return "High intent";
  if (score >= 40) return "Warm";
  return "Routine";
}

const fallbackInquiryEmailTemplate: NotificationTemplateRecord = {
  id: "fallback-inquiry-email",
  name: "Inquiry Email Reply",
  channel: "email",
  purpose: "inquiry_email",
  subject: "NextStep Global - {{subject}}",
  message:
    "Hi {{name}},\n\nThank you for contacting NextStep Global.\nWe received your inquiry about \"{{subject}}\".\n\nOur counselor will guide you with course selection, admission process, scholarships, visa documentation, and next steps.\n\nPlease share your preferred study destination, current qualification, and intake timeline so we can assist you better.\n\nRegards,\nNextStep Global",
  updatedAt: "",
};

const fallbackInquiryWhatsAppTemplate: NotificationTemplateRecord = {
  ...fallbackInquiryEmailTemplate,
  id: "fallback-inquiry-whatsapp",
  name: "Inquiry WhatsApp Reply",
  channel: "whatsapp",
  purpose: "inquiry_whatsapp",
  subject: "NextStep Global inquiry reply",
};

function applyTemplate(template: string, inquiry: AdminInquiry) {
  const values: Record<string, string> = {
    name: inquiry.name || "there",
    email: inquiry.email || "",
    phone: inquiry.phone || "",
    whatsapp: inquiry.whatsapp || "",
    subject: inquiry.subject || "your study abroad inquiry",
    message: inquiry.message || "",
    status: inquiry.status || "",
  };

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => values[key] ?? "");
}

function findTemplate(templates: NotificationTemplateRecord[], purpose: string, fallback: NotificationTemplateRecord) {
  return templates.find((template) => template.purpose === purpose) || fallback;
}

function buildMailToLink(inquiry: AdminInquiry, template: NotificationTemplateRecord) {
  const subject = applyTemplate(template.subject, inquiry);
  const body = applyTemplate(template.message, inquiry);
  return `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildWhatsAppLink(inquiry: AdminInquiry, template: NotificationTemplateRecord) {
  const rawPhone = String(inquiry.whatsapp || inquiry.phone || "").replace(/\D/g, "");
  if (!rawPhone) return null;
  return `https://wa.me/${rawPhone}?text=${encodeURIComponent(applyTemplate(template.message, inquiry))}`;
}

export default function AdminInquiriesPage() {
  const { data: rawInquiries, isLoading } = useListInquiries();
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/notification-templates"],
    queryFn: listNotificationTemplates,
  });
  const inquiries = (rawInquiries ?? []) as AdminInquiry[];
  const updateInquiry = useUpdateInquiry();
  const deleteInquiry = useDeleteInquiry();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const enrichedInquiries = useMemo(
    () =>
      inquiries
        .map((inquiry) => ({ ...inquiry, priority: getPriority(inquiry), ageDays: daysSince(inquiry.createdAt) }))
        .sort((a, b) => b.priority - a.priority || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [inquiries],
  );

  const filteredInquiries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return enrichedInquiries.filter((inquiry) => {
      const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter;
      const matchesQuery =
        !query ||
        [inquiry.name, inquiry.email, inquiry.subject, inquiry.message, inquiry.phone, inquiry.whatsapp]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [enrichedInquiries, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const pending = inquiries.filter((inquiry) => inquiry.status === "pending").length;
    const highIntent = enrichedInquiries.filter((inquiry) => inquiry.priority >= 70).length;
    const overdue = inquiries.filter((inquiry) => inquiry.followUpAt && new Date(inquiry.followUpAt).getTime() < Date.now()).length;
    const contacted = inquiries.filter((inquiry) => inquiry.status === "contacted").length;
    return [
      { label: "Open leads", value: pending, tone: "text-amber-700" },
      { label: "High intent", value: highIntent, tone: "text-rose-700" },
      { label: "Follow-ups due", value: overdue, tone: "text-blue-700" },
      { label: "Contacted", value: contacted, tone: "text-emerald-700" },
    ];
  }, [enrichedInquiries, inquiries]);

  const handleStatusChange = (id: number, status: string) => {
    updateInquiry.mutate({ inquiryId: id, data: { status: status as InquiryStatus } }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        queryClient.invalidateQueries({ queryKey: getListInquiriesQueryKey() });
      },
      onError: () => {
        toast({ title: "Error updating status", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    deleteInquiry.mutate({ inquiryId: id }, {
      onSuccess: () => {
        toast({ title: "Inquiry deleted" });
        queryClient.invalidateQueries({ queryKey: getListInquiriesQueryKey() });
      },
      onError: () => {
        toast({ title: "Error deleting inquiry", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Lead Inbox
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Manage Inquiries</h2>
            <p className="text-muted-foreground">Prioritize, search, and contact student inquiries faster.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[520px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, email, subject..."
                className="h-11 bg-white pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-11 bg-white">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="modern-admin-panel p-4">
              <div className={`text-3xl font-bold ${metric.tone}`}>{metric.value}</div>
              <div className="mt-1 text-sm font-medium text-slate-600">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="modern-admin-panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Lead</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No inquiries match the current view.
                  </TableCell>
                </TableRow>
              )}
              {filteredInquiries.map((inq) => {
                const emailTemplate = findTemplate(templates, "inquiry_email", fallbackInquiryEmailTemplate);
                const whatsAppTemplate = findTemplate(templates, "inquiry_whatsapp", fallbackInquiryWhatsAppTemplate);
                const whatsAppLink = buildWhatsAppLink(inq, whatsAppTemplate);

                return (
                <TableRow key={inq.id}>
                  <TableCell className="min-w-[220px]">
                    <div className="font-medium">{inq.name}</div>
                    <div className="text-xs text-muted-foreground">{inq.email}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(inq.createdAt).toLocaleDateString()}</span>
                      {inq.ageDays > 0 && <span>{inq.ageDays}d old</span>}
                      {inq.assignedToName && <span>Owner: {inq.assignedToName}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[340px]">
                    <div className="font-medium">{inq.subject}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{inq.message}</div>
                    {inq.followUpAt && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        <CalendarClock className="h-3 w-3" />
                        {new Date(inq.followUpAt).toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-[150px] items-center gap-3">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#d9a31a]" style={{ width: `${inq.priority}%` }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{inq.priority}</div>
                        <div className="text-xs text-muted-foreground">{priorityLabel(inq.priority)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant="outline" className={statusStyles[inq.status]}>
                        {inq.status}
                      </Badge>
                      <Select value={inq.status} onValueChange={(val) => handleStatusChange(inq.id, val)}>
                        <SelectTrigger className="w-[130px] bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" asChild title="Email lead">
                        <a href={buildMailToLink(inq, emailTemplate)}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                      {whatsAppLink && (
                        <Button variant="outline" size="icon" asChild title="Open WhatsApp">
                          <a href={whatsAppLink} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(inq.id)} className="text-destructive" title="Delete inquiry">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
