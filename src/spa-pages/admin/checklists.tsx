import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createDocumentChecklist, deleteDocumentChecklist, listDocumentChecklists, updateDocumentChecklist, type DocumentChecklistTemplateRecord, type ProgramLevel } from "@/lib/api";

const blank = { destination: "", programLevel: "any" as ProgramLevel, title: "", itemsText: "Passport\nAcademic transcripts\nStatement of purpose\nFinancial documents" };

export default function AdminChecklistsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["/api/document-checklists"], queryFn: () => listDocumentChecklists() });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(blank);
  const [required, setRequired] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const items = () => form.itemsText.split(/\r?\n/).map((label, index) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `item-${index + 1}`, label: label.trim(), required })).filter((item) => item.label);

  const save = async () => {
    try {
      const payload = { destination: form.destination, programLevel: form.programLevel, title: form.title, items: items() };
      if (editingId) await updateDocumentChecklist(editingId, payload);
      else await createDocumentChecklist(payload);
      setForm(blank);
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/document-checklists"] });
      toast({ title: "Checklist saved" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save checklist", variant: "destructive" });
    }
  };

  const edit = (item: DocumentChecklistTemplateRecord) => {
    setEditingId(item.id);
    setForm({ destination: item.destination, programLevel: item.programLevel, title: item.title, itemsText: item.items.map((doc) => doc.label).join("\n") });
  };

  const remove = async (id: number) => {
    await deleteDocumentChecklist(id);
    await queryClient.invalidateQueries({ queryKey: ["/api/document-checklists"] });
    toast({ title: "Checklist deleted" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#101b31] px-6 py-7 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">Document Checklists</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Build destination-ready checklists.</h2>
          <p className="mt-3 max-w-2xl text-slate-200">Students see these items in their portal and can upload matching documents.</p>
        </section>

        <Card className="rounded-[1.5rem]">
          <CardHeader><CardTitle>{editingId ? "Edit Checklist" : "Add Checklist"}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Destination, e.g. Canada" />
            <Select value={form.programLevel} onValueChange={(value) => setForm({ ...form, programLevel: value as ProgramLevel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["any", "undergraduate", "postgraduate", "research", "diploma"].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="md:col-span-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Checklist title" />
            <textarea className="min-h-36 rounded-xl border border-slate-200 p-3 text-sm md:col-span-2" value={form.itemsText} onChange={(e) => setForm({ ...form, itemsText: e.target.value })} />
            <label className="flex items-center gap-3 text-sm font-medium"><Checkbox checked={required} onCheckedChange={(checked) => setRequired(checked === true)} /> Mark new lines as required</label>
            <Button onClick={save} className="md:col-span-2">{editingId ? "Update checklist" : "Create checklist"}</Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? <div>Loading...</div> : data.map((item) => (
            <Card key={item.id} className="rounded-[1.5rem]">
              <CardContent className="space-y-3 p-5">
                <div className="text-lg font-semibold text-slate-900">{item.title}</div>
                <div className="text-sm text-slate-600">{item.destination} / {item.programLevel}</div>
                <div className="flex flex-wrap gap-2">{item.items.map((doc) => <span key={doc.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{doc.label}</span>)}</div>
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
