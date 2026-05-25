import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetMyProfile, useListUsers } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { listInquiriesManual, updateInquiryLead, type InquiryRecord } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Mail, Phone } from "lucide-react";
import { useState } from "react";

const stages: Array<{ value: NonNullable<InquiryRecord["leadStage"]>; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "counseling", label: "Counseling" },
  { value: "documents", label: "Documents" },
  { value: "applied", label: "Applied" },
  { value: "visa", label: "Visa" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

function stageFor(inquiry: InquiryRecord): NonNullable<InquiryRecord["leadStage"]> {
  return inquiry.leadStage || (inquiry.status === "resolved" ? "converted" : inquiry.status === "contacted" ? "contacted" : "new");
}

export default function AdminPipelinePage() {
  useGetMyProfile({ query: { retry: false, refetchOnWindowFocus: false } as any });
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["/api/inquiries"],
    queryFn: listInquiriesManual,
  });
  const { data: users = [] } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<number | null>(null);

  const moveLead = async (inquiry: InquiryRecord, leadStage: NonNullable<InquiryRecord["leadStage"]>) => {
    setSavingId(inquiry.id);
    try {
      await updateInquiryLead(inquiry.id, {
        leadStage,
        notes: inquiry.notes || null,
        followUpAt: inquiry.followUpAt || null,
        assignedToUserId: inquiry.assignedToUserId || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Lead stage updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update lead", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const updateNotes = async (inquiry: InquiryRecord, notes: string) => {
    setSavingId(inquiry.id);
    try {
      await updateInquiryLead(inquiry.id, {
        leadStage: stageFor(inquiry),
        notes,
        followUpAt: inquiry.followUpAt || null,
        assignedToUserId: inquiry.assignedToUserId || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Lead note saved" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save note", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const assignLead = async (inquiry: InquiryRecord, assignedToUserId: string) => {
    setSavingId(inquiry.id);
    try {
      await updateInquiryLead(inquiry.id, {
        leadStage: stageFor(inquiry),
        notes: inquiry.notes || null,
        followUpAt: inquiry.followUpAt || null,
        assignedToUserId: assignedToUserId === "unassigned" ? null : assignedToUserId,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Lead owner updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to assign lead", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lead Pipeline</h2>
          <p className="text-muted-foreground">Move inquiries through counseling, application, visa, and conversion stages.</p>
        </div>

        <div className="grid gap-4 overflow-x-auto pb-4 xl:grid-cols-4 2xl:grid-cols-8">
          {stages.map((stage) => {
            const stageInquiries = inquiries.filter((inquiry) => stageFor(inquiry) === stage.value);
            return (
              <div key={stage.value} className="min-w-[280px] rounded-md border bg-white">
                <div className="border-b p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{stage.label}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{stageInquiries.length}</span>
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  {stageInquiries.length === 0 && (
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">No leads</div>
                  )}
                  {stageInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="rounded-md border bg-slate-50 p-4">
                      <div className="font-semibold">{inquiry.name}</div>
                      <div className="mt-1 text-sm text-slate-700">{inquiry.subject}</div>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {inquiry.email}</div>
                        {inquiry.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {inquiry.phone}</div>}
                        {inquiry.assignedToName && <div className="flex items-center gap-2">Owner: {inquiry.assignedToName}</div>}
                        {inquiry.followUpAt && <div className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5" /> {new Date(inquiry.followUpAt).toLocaleString()}</div>}
                      </div>
                      <Textarea
                        className="mt-3 bg-white"
                        rows={3}
                        defaultValue={inquiry.notes || ""}
                        placeholder="Lead notes..."
                        onBlur={(event) => updateNotes(inquiry, event.target.value)}
                      />
                      <Select
                        value={stageFor(inquiry)}
                        disabled={savingId === inquiry.id}
                        onValueChange={(value) => moveLead(inquiry, value as NonNullable<InquiryRecord["leadStage"]>)}
                      >
                        <SelectTrigger className="mt-3 bg-white">
                          <SelectValue placeholder="Move lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((target) => (
                            <SelectItem key={target.value} value={target.value}>
                              {target.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={inquiry.assignedToUserId || "unassigned"}
                        disabled={savingId === inquiry.id}
                        onValueChange={(value) => assignLead(inquiry, value)}
                      >
                        <SelectTrigger className="mt-3 bg-white">
                          <SelectValue placeholder="Assign lead" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.filter((user) => user.role !== "user").map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
