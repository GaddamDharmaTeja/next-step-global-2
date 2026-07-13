import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAuditLogs } from "@/lib/api";

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/api/audit-logs", search, type, page],
    queryFn: () => listAuditLogs({ search, type: type === "all" ? "" : type, page, pageSize }),
  });
  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Logs</h2>
          <p className="text-muted-foreground">Login activity, image changes, content updates, errors, and admin actions.</p>
        </div>

        <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px_auto]">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search logs..." />
          <Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="login">Login activity</SelectItem>
              <SelectItem value="media">Images</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center justify-end text-sm text-slate-500">{total} events</div>
        </div>

        {isError && (
          <div className="modern-admin-panel p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load logs"}
          </div>
        )}

        <div className="modern-admin-panel overflow-hidden">
          <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_1.1fr_1.2fr] gap-3 border-b bg-slate-50 p-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 md:grid">
            <div>ID</div>
            <div>User</div>
            <div>Type</div>
            <div>Action</div>
            <div>Timestamp / Details</div>
          </div>
          <div className="divide-y">
            {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading logs...</div>}
            {!isLoading && logs.length === 0 && <div className="p-6 text-sm text-muted-foreground">No matching audit events.</div>}
            {logs.map((entry) => (
              <div key={entry.id} className="grid gap-3 p-4 text-sm md:grid-cols-[1.1fr_1fr_0.8fr_1.1fr_1.2fr] md:items-start">
                <div className="break-all font-mono text-xs text-slate-500">{entry.id}</div>
                <div>
                  <div className="font-medium text-slate-900">{entry.actorName}</div>
                  <div className="text-xs uppercase text-slate-500">{entry.actorRole}</div>
                </div>
                <div className="font-medium text-slate-700">{entry.entityType}</div>
                <div className="font-medium text-slate-900">{entry.action}</div>
                <div>
                  <div className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</div>
                  <div className="mt-1 leading-6 text-slate-700">{entry.summary}</div>
                  <div className="mt-1 text-xs text-slate-500">{entry.entityType}/{entry.entityId}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
          <div className="text-sm text-slate-500">Page {page} of {totalPages}</div>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
