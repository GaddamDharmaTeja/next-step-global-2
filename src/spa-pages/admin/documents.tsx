import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listStudentDocuments, updateStudentDocument, type StudentDocumentRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useListUsers } from "@workspace/api-client-react";

export default function AdminDocumentsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["/api/student-documents"], queryFn: listStudentDocuments });
  const { data: users = [] } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const assignableUsers = users.filter((user) => user.role === "user");

  const save = async (
    doc: StudentDocumentRecord,
    status: StudentDocumentRecord["status"],
    note: string | null,
    assignedToUserId = doc.assignedToUserId || "",
  ) => {
    try {
      await updateStudentDocument(doc.id, { status, note, assignedToUserId });
      await queryClient.invalidateQueries({ queryKey: ["/api/student-documents"] });
      toast({ title: "Document updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update document", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Documents</h2>
          <p className="text-muted-foreground">Review uploaded files and update their processing status.</p>
        </div>
        <div className="space-y-4">
          {data.length === 0 && <div className="modern-admin-panel p-6 text-sm text-muted-foreground">No documents uploaded yet.</div>}
          {data.map((doc) => (
            <div key={doc.id} className="modern-admin-panel grid gap-4 p-4 md:grid-cols-[1.7fr_170px_170px_1fr_auto]">
              <div>
                <div className="font-medium">{doc.fileName}</div>
                <div className="text-xs text-muted-foreground">{doc.userName || doc.userEmail}</div>
                <a className="mt-2 inline-block text-sm text-sky-700 hover:underline" href={doc.fileUrl} target="_blank" rel="noreferrer">Open document</a>
              </div>
              <Select defaultValue={doc.status} onValueChange={(value) => save(doc, value as StudentDocumentRecord["status"], doc.note || null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue={doc.assignedToUserId || "none"} onValueChange={(value) => save(doc, doc.status, doc.note || null, value === "none" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="Assign user" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input defaultValue={doc.note || ""} onBlur={(e) => save(doc, doc.status, e.target.value || null)} placeholder="Reviewer note" />
              <Button variant="outline" onClick={() => save(doc, doc.status, doc.note || null)}>Save</Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
