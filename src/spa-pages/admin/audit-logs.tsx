import { AdminLayout } from "@/components/layout/admin-layout";
import { listAuditLogs } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function AdminAuditLogsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["/api/audit-logs"], queryFn: listAuditLogs });

  if (isLoading) {
    return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">A running history of user, content, invite, lead, and document changes.</p>
        </div>
        <div className="rounded-md border bg-white">
          <div className="divide-y">
            {data.length === 0 && <div className="p-6 text-sm text-muted-foreground">No audit events yet.</div>}
            {data.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">{entry.summary}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.actorName} ({entry.actorRole}) • {entry.action} • {entry.entityType}/{entry.entityId}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
