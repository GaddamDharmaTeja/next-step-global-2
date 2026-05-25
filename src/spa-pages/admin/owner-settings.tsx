import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { listOwnerSettings, updateOwnerSettings, type OwnerSettingsRecord } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function AdminOwnerSettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["/api/owner-settings"], queryFn: listOwnerSettings });
  const [form, setForm] = useState<OwnerSettingsRecord | null>(null);
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

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Owner Settings</h2>
          <p className="text-muted-foreground">Manage business identity, support contacts, and default operating copy.</p>
        </div>

        <div className="grid gap-4 rounded-md border bg-white p-6 md:grid-cols-2">
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
      </div>
    </AdminLayout>
  );
}
