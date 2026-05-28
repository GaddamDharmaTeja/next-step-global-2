import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { deleteAppointment, listAppointments, updateAppointment, type AppointmentRecord } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Mail, MessageCircle, Pencil, Phone, Search, Trash2 } from "lucide-react";
import { useListUsers } from "@workspace/api-client-react";

const statusLabels: Record<AppointmentRecord["status"], string> = {
  requested: "Requested",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const allStatuses = ["all", "requested", "scheduled", "completed", "cancelled"] as const;

function appointmentMessage(appointment: AppointmentRecord) {
  return `Hi ${appointment.name},

This is NextStep Global regarding your study abroad consultation.

Appointment details:
Date: ${appointment.preferredDate}
Time: ${appointment.preferredTime}
Destination: ${appointment.destination || "Not specified"}
Status: ${statusLabels[appointment.status]}

Please confirm your availability.

Regards,
NextStep Global`;
}

function openMail(appointment: AppointmentRecord) {
  const subject = `NextStep Global consultation - ${appointment.preferredDate}`;
  window.location.href = `mailto:${appointment.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(appointmentMessage(appointment))}`;
}

function openWhatsApp(appointment: AppointmentRecord) {
  const phone = appointment.phone.replace(/\D/g, "");
  if (!phone) return;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(appointmentMessage(appointment))}`, "_blank", "noopener,noreferrer");
}

function openCall(appointment: AppointmentRecord) {
  window.location.href = `tel:${appointment.phone}`;
}

export default function AdminAppointmentsPage() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: listAppointments,
  });
  const { data: users = [] } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof allStatuses)[number]>("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<AppointmentRecord | null>(null);
  const [editForm, setEditForm] = useState({
    status: "requested" as AppointmentRecord["status"],
    destination: "",
    assignedToUserId: "none",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });

  const destinations = useMemo(() => {
    return Array.from(new Set(appointments.map((appointment) => appointment.destination).filter(Boolean) as string[])).sort();
  }, [appointments]);

  const assignees = useMemo(() => {
    return users.filter((user) => user.role === "admin" || user.role === "owner");
  }, [users]);

  const filteredAppointments = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesSearch = !needle || [
        appointment.name,
        appointment.email,
        appointment.phone,
        appointment.destination || "",
        appointment.notes || "",
      ].some((value) => value.toLowerCase().includes(needle));
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesDestination = destinationFilter === "all" || appointment.destination === destinationFilter;
      const matchesFrom = !dateFrom || appointment.preferredDate >= dateFrom;
      const matchesTo = !dateTo || appointment.preferredDate <= dateTo;
      return matchesSearch && matchesStatus && matchesDestination && matchesFrom && matchesTo;
    });
  }, [appointments, dateFrom, dateTo, destinationFilter, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      today: appointments.filter((appointment) => appointment.preferredDate === new Date().toISOString().slice(0, 10)).length,
      requested: appointments.filter((appointment) => appointment.status === "requested").length,
      scheduled: appointments.filter((appointment) => appointment.status === "scheduled").length,
      completed: appointments.filter((appointment) => appointment.status === "completed").length,
    };
  }, [appointments]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
  };

  const changeStatus = async (appointment: AppointmentRecord, status: AppointmentRecord["status"]) => {
    try {
      await updateAppointment(appointment.id, { status });
      await refresh();
      toast({ title: "Appointment updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update appointment", variant: "destructive" });
    }
  };

  const openEdit = (appointment: AppointmentRecord) => {
    setEditing(appointment);
    setEditForm({
      status: appointment.status,
      destination: appointment.destination || "",
      assignedToUserId: appointment.assignedToUserId || "none",
      preferredDate: appointment.preferredDate,
      preferredTime: appointment.preferredTime,
      notes: appointment.notes || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateAppointment(editing.id, {
        status: editForm.status,
        destination: editForm.destination,
        assignedToUserId: editForm.assignedToUserId === "none" ? "" : editForm.assignedToUserId,
        preferredDate: editForm.preferredDate,
        preferredTime: editForm.preferredTime,
        notes: editForm.notes,
      });
      await refresh();
      setEditing(null);
      toast({ title: "Appointment details updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save appointment", variant: "destructive" });
    }
  };

  const removeAppointment = async (appointmentId: number) => {
    if (!confirm("Delete this appointment?")) return;
    try {
      await deleteAppointment(appointmentId);
      await refresh();
      toast({ title: "Appointment deleted" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to delete appointment", variant: "destructive" });
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">Review consultation requests, contact students, and update scheduling status.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Today", value: stats.today },
            { label: "Requested", value: stats.requested },
            { label: "Scheduled", value: stats.scheduled },
            { label: "Completed", value: stats.completed },
          ].map((stat) => (
            <div key={stat.label} className="modern-admin-panel p-5">
              <div className="text-sm font-semibold text-muted-foreground">{stat.label}</div>
              <div className="mt-2 text-3xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="modern-admin-panel grid gap-4 p-4 md:grid-cols-[1.4fr_180px_180px_150px_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email, phone, destination..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {allStatuses.map((status) => (
                <SelectItem key={status} value={status}>{status === "all" ? "All statuses" : statusLabels[status]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={destinationFilter} onValueChange={setDestinationFilter}>
            <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All destinations</SelectItem>
              {destinations.map((destination) => (
                <SelectItem key={destination} value={destination}>{destination}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>

        <div className="modern-admin-panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Preferred Slot</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No appointment requests match your filters.</TableCell></TableRow>
              )}
              {filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="font-medium">{appointment.name}</div>
                    <div className="text-xs text-muted-foreground">{appointment.email}</div>
                    <div className="text-xs text-muted-foreground">{appointment.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium"><CalendarDays className="h-4 w-4 text-muted-foreground" /> {appointment.preferredDate}</div>
                    <div className="text-xs text-muted-foreground">{appointment.preferredTime}</div>
                  </TableCell>
                  <TableCell>{appointment.destination || "Not specified"}</TableCell>
                  <TableCell>
                    <Select
                      value={appointment.assignedToUserId || "none"}
                      onValueChange={(value) => updateAppointment(appointment.id, { assignedToUserId: value === "none" ? "" : value }).then(refresh)}
                    >
                      <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {assignees.map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={appointment.status} onValueChange={(value) => changeStatus(appointment, value as AppointmentRecord["status"])}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">{appointment.notes || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Email" onClick={() => openMail(appointment)}><Mail className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="WhatsApp" onClick={() => openWhatsApp(appointment)}><MessageCircle className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Call" onClick={() => openCall(appointment)}><Phone className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(appointment)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" title="Delete" onClick={() => removeAppointment(appointment.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm((current) => ({ ...current, status: value as AppointmentRecord["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={editForm.destination} onChange={(event) => setEditForm((current) => ({ ...current, destination: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Assigned User</Label>
              <Select value={editForm.assignedToUserId} onValueChange={(value) => setEditForm((current) => ({ ...current, assignedToUserId: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {assignees.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={editForm.preferredDate} onChange={(event) => setEditForm((current) => ({ ...current, preferredDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={editForm.preferredTime} onChange={(event) => setEditForm((current) => ({ ...current, preferredTime: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={4} value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Appointment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
