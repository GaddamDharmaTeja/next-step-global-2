import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  clearDatabaseCollections,
  getDatabaseStats,
  listOwnerSettings,
  updateOwnerSettings,
  type OwnerSettingsRecord,
} from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminOwnerSettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["/api/owner-settings"], queryFn: listOwnerSettings });
  const { data: dbStats, isLoading: isStatsLoading } = useQuery({ queryKey: ["/api/owner-settings/database"], queryFn: getDatabaseStats });
  const [form, setForm] = useState<OwnerSettingsRecord | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  }

  const save = async () => {
    try {
      await updateOwnerSettings(form);
      await queryClient.invalidateQueries({ queryKey: ["/api/owner-settings"] });
      toast({ title: "Owner settings updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save settings", variant: "destructive" });
    }
  };

  const toggleCollection = (key: string, checked: boolean) => {
    setSelectedCollections((current) =>
      checked ? Array.from(new Set([...current, key])) : current.filter((item) => item !== key),
    );
  };

  const clearSelected = async () => {
    if (selectedCollections.length === 0) {
      toast({ title: "Select data to clear", variant: "destructive" });
      return;
    }
    if (!confirm(`Clear selected data: ${selectedCollections.join(", ")}? This cannot be undone.`)) return;

    try {
      const result = await clearDatabaseCollections(selectedCollections);
      setSelectedCollections([]);
      await queryClient.invalidateQueries({ queryKey: ["/api/owner-settings/database"] });
      await queryClient.invalidateQueries();
      toast({ title: `Cleared ${result.cleared?.join(", ") || "selected data"}` });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to clear data", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Owner Settings</h2>
          <p className="text-muted-foreground">Manage business identity, support contacts, and default operating copy.</p>
        </div>

        <div className="modern-admin-panel grid gap-4 p-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Owner Name</Label>
            <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Support Phone</Label>
            <Input value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Brand Tagline</Label>
            <Input value={form.brandTagline} onChange={(e) => setForm({ ...form, brandTagline: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Default Counselor Message</Label>
            <Textarea rows={5} value={form.defaultCounselorMessage} onChange={(e) => setForm({ ...form, defaultCounselorMessage: e.target.value })} />
          </div>
          <Button onClick={save} className="md:col-span-2">Save Owner Settings</Button>
        </div>

        <div className="modern-admin-panel space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Database Control</h3>
              <p className="text-sm text-muted-foreground">Check stored data size and clear selected collections from the owner account.</p>
            </div>
            <div className="rounded-xl border bg-white px-4 py-3 text-right">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Estimated DB Size</div>
              <div className="text-2xl font-bold">{dbStats ? formatBytes(dbStats.totalBytes) : "..."}</div>
            </div>
          </div>

          {isStatsLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading database stats...</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(dbStats?.collections || []).map((collection) => (
                <label
                  key={collection.key}
                  className={`flex items-center justify-between gap-4 rounded-xl border bg-white p-4 ${collection.clearable ? "" : "opacity-60"}`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      disabled={!collection.clearable}
                      checked={selectedCollections.includes(collection.key)}
                      onCheckedChange={(checked) => toggleCollection(collection.key, checked === true)}
                    />
                    <div>
                      <div className="font-semibold text-slate-900">{collection.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {collection.count} records | {formatBytes(collection.bytes)}
                      </div>
                    </div>
                  </div>
                  {!collection.clearable && <span className="text-xs font-medium text-muted-foreground">Protected</span>}
                </label>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="destructive"
            disabled={selectedCollections.length === 0}
            onClick={clearSelected}
            className="w-full"
          >
            Clear Selected Data
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Protected data cannot be cleared here. User accounts are managed from Users, and role permissions are managed from Roles.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
