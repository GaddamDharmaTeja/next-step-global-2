import { AdminLayout } from "@/components/layout/admin-layout";
import { useListInquiries, useUpdateInquiry, useDeleteInquiry, getListInquiriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InquiryStatus = "pending" | "contacted" | "resolved";

export default function AdminInquiriesPage() {
  const { data: inquiries, isLoading } = useListInquiries();
  const updateInquiry = useUpdateInquiry();
  const deleteInquiry = useDeleteInquiry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Inquiries</h2>
          <p className="text-muted-foreground">Review and respond to student inquiries.</p>
        </div>

        <div className="bg-white border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No inquiries found.
                  </TableCell>
                </TableRow>
              )}
              {inquiries?.map((inq) => (
                <TableRow key={inq.id}>
                  <TableCell>{new Date(inq.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="font-medium">{inq.name}</div>
                    <div className="text-xs text-muted-foreground">{inq.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{inq.subject}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{inq.message}</div>
                  </TableCell>
                  <TableCell>
                    <Select value={inq.status} onValueChange={(val) => handleStatusChange(inq.id, val)}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(inq.id)} className="text-destructive">
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
