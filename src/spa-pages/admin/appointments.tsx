import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { deleteAppointment, listAppointments, updateAppointment, type AppointmentRecord } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

const statusLabels: Record<AppointmentRecord["status"], string> = {
  requested: "Requested",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminAppointmentsPage() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: listAppointments,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const changeStatus = async (appointment: AppointmentRecord, status: AppointmentRecord["status"]) => {
    try {
      await updateAppointment(appointment.id, { status });
      await queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Appointment updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update appointment", variant: "destructive" });
    }
  };

  const removeAppointment = async (appointmentId: number) => {
    if (!confirm("Delete this appointment?")) return;
    try {
      await deleteAppointment(appointmentId);
      await queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
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
          <p className="text-muted-foreground">Review consultation requests and update scheduling status.</p>
        </div>

        <div className="modern-admin-panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Preferred Slot</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No appointment requests yet.</TableCell></TableRow>
              )}
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="font-medium">{appointment.name}</div>
                    <div className="text-xs text-muted-foreground">{appointment.email}</div>
                    <div className="text-xs text-muted-foreground">{appointment.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div>{appointment.preferredDate}</div>
                    <div className="text-xs text-muted-foreground">{appointment.preferredTime}</div>
                  </TableCell>
                  <TableCell>{appointment.destination || "Not specified"}</TableCell>
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
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeAppointment(appointment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
