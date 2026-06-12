import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createScholarship, deleteScholarship, listScholarships, updateScholarship, type ProgramLevel, type ScholarshipRecord } from "@/lib/api";

const blank = {
  name: "",
  country: "",
  programLevel: "any" as ProgramLevel,
  eligibility: "",
  awardValue: "",
  deadline: "",
  intake: "",
  applicationLink: "",
  active: true,
};

export default function AdminScholarshipsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["/api/scholarships"], queryFn: () => listScholarships() });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = async () => {
    try {
      const payload = { ...form, intake: form.intake || null, applicationLink: form.applicationLink || null };
      if (editingId) await updateScholarship(editingId, payload);
      else await createScholarship(payload);
      setForm(blank);
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/scholarships"] });
      toast({ title: "Scholarship saved" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save scholarship", variant: "destructive" });
    }
  };

  const edit = (item: ScholarshipRecord) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      country: item.country,
      programLevel: item.programLevel,
      eligibility: item.eligibility,
      awardValue: item.awardValue,
      deadline: item.deadline,
      intake: item.intake || "",
      applicationLink: item.applicationLink || "",
      active: item.active,
    });
  };

  const remove = async (id: number) => {
    await deleteScholarship(id);
    await queryClient.invalidateQueries({ queryKey: ["/api/scholarships"] });
    toast({ title: "Scholarship deleted" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#101b31] px-6 py-7 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">Scholarship Finder</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Manage funding opportunities.</h2>
          <p className="mt-3 max-w-2xl text-slate-200">These records power the public and student scholarship finder.</p>
        </section>

        <Card className="rounded-[1.5rem]">
          <CardHeader><CardTitle>{editingId ? "Edit Scholarship" : "Add Scholarship"}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Scholarship name" />
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" />
            <Select value={form.programLevel} onValueChange={(value) => setForm({ ...form, programLevel: value as ProgramLevel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["any", "undergraduate", "postgraduate", "research", "diploma"].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={form.awardValue} onChange={(e) => setForm({ ...form, awardValue: e.target.value })} placeholder="Award value" />
            <Input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="Deadline, e.g. 2026-09-30" />
            <Input value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} placeholder="Intake" />
            <Input className="md:col-span-2" value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} placeholder="Eligibility" />
            <Input className="md:col-span-2" value={form.applicationLink} onChange={(e) => setForm({ ...form, applicationLink: e.target.value })} placeholder="Application link" />
            <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /> Active</label>
            <Button onClick={save} className="md:col-span-2">{editingId ? "Update scholarship" : "Create scholarship"}</Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? <div>Loading...</div> : data.map((item) => (
            <Card key={item.id} className="rounded-[1.5rem]">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-600">{item.country} / {item.programLevel}</div>
                  </div>
                  <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">{item.awardValue}</div>
                </div>
                <p className="text-sm leading-6 text-slate-600">{item.eligibility}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => edit(item)}>Edit</Button>
                  <Button variant="destructive" onClick={() => remove(item.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
