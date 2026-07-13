import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createConsultant,
  deleteConsultant,
  listConsultants,
  updateConsultant,
  uploadImageFile,
  type ConsultantRecord,
} from "@/lib/api";
import { assetUrl } from "@/lib/runtime";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const consultantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  specialty: z.string().min(1, "Specialty is required"),
  experience: z.string().min(1, "Experience is required"),
  imageUrl: z.string().optional(),
  bio: z.string().min(1, "Bio is required"),
  countries: z.string().min(1, "Add at least one country"),
  languages: z.string().min(1, "Add at least one language"),
  featured: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});

type ConsultantForm = z.infer<typeof consultantSchema>;

function toLines(value: string[]) {
  return value.join("\n");
}

function toArray(value: string) {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function toPayload(values: ConsultantForm) {
  return {
    ...values,
    imageUrl: values.imageUrl || null,
    countries: toArray(values.countries),
    languages: toArray(values.languages),
  };
}

export default function AdminConsultantsPage() {
  const { data: consultants = [], isLoading } = useQuery({
    queryKey: ["/api/consultants"],
    queryFn: listConsultants,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<ConsultantForm>({
    resolver: zodResolver(consultantSchema),
    defaultValues: {
      name: "",
      role: "",
      specialty: "",
      experience: "",
      imageUrl: "",
      bio: "",
      countries: "",
      languages: "",
      featured: true,
      sortOrder: 0,
    },
  });

  const resetForNew = () => {
    setEditingId(null);
    form.reset({
      name: "",
      role: "",
      specialty: "",
      experience: "",
      imageUrl: "",
      bio: "",
      countries: "",
      languages: "",
      featured: true,
      sortOrder: consultants.length + 1,
    });
    setIsDialogOpen(true);
  };

  const editConsultant = (consultant: ConsultantRecord) => {
    setEditingId(consultant.id);
    form.reset({
      name: consultant.name,
      role: consultant.role,
      specialty: consultant.specialty,
      experience: consultant.experience,
      imageUrl: consultant.imageUrl || "",
      bio: consultant.bio,
      countries: toLines(consultant.countries),
      languages: toLines(consultant.languages),
      featured: consultant.featured,
      sortOrder: consultant.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: ConsultantForm) => {
    setIsSaving(true);
    try {
      if (editingId) {
        await updateConsultant(editingId, toPayload(values));
        toast({ title: "Consultant updated" });
      } else {
        await createConsultant(toPayload(values));
        toast({ title: "Consultant created" });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      setIsDialogOpen(false);
      setEditingId(null);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to save consultant",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this consultant?")) return;
    try {
      await deleteConsultant(id);
      toast({ title: "Consultant deleted" });
      await queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to delete consultant",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const uploaded = await uploadImageFile(file, { category: "consultant" });
      form.setValue("imageUrl", uploaded.url, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Consultant image uploaded" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Manage Consultants</h2>
            <p className="text-muted-foreground">Edit mentor cards, specialties, photos, languages, and public visibility.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForNew}><Plus className="mr-2 h-4 w-4" /> Add Consultant</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Consultant" : "Add Consultant"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem><FormLabel>Role</FormLabel><FormControl><Input placeholder="Senior Education Consultant" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="specialty" render={({ field }) => (
                      <FormItem><FormLabel>Specialty</FormLabel><FormControl><Input placeholder="Canada and visa planning" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="experience" render={({ field }) => (
                      <FormItem><FormLabel>Experience</FormLabel><FormControl><Input placeholder="12 Years" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultant Photo</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input type="file" accept="image/*" disabled={isUploadingImage} onChange={(event) => handleImageUpload(event.target.files?.[0] || null)} />
                          {field.value && <img src={assetUrl(field.value)} alt="Consultant preview" className="h-32 w-32 rounded-full object-cover" />}
                          <Input type="hidden" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="countries" render={({ field }) => (
                      <FormItem><FormLabel>Countries</FormLabel><FormControl><Textarea rows={5} placeholder="One per line" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="languages" render={({ field }) => (
                      <FormItem><FormLabel>Languages</FormLabel><FormControl><Textarea rows={5} placeholder="One per line" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="sortOrder" render={({ field }) => (
                      <FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="featured" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">Visible on public consultants page</FormLabel>
                          <div className="text-sm text-muted-foreground">Turn off to hide without deleting.</div>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Consultant"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="modern-admin-panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consultant</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultants.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center">No consultants found.</TableCell></TableRow>
              )}
              {consultants.map((consultant) => (
                <TableRow key={consultant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                        {consultant.imageUrl && <img src={assetUrl(consultant.imageUrl)} alt={consultant.name} className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-medium">{consultant.name}</div>
                        <div className="text-sm text-muted-foreground">{consultant.role}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{consultant.specialty}</TableCell>
                  <TableCell>{consultant.countries.join(", ")}</TableCell>
                  <TableCell>{consultant.featured ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => editConsultant(consultant)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(consultant.id)}>
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
