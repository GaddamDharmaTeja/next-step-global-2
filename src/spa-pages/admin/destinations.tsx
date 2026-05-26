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
  createDestination,
  deleteDestination,
  listDestinations,
  updateDestination,
  type DestinationRecord,
} from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const destinationSchema = z.object({
  slug: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  overview: z.string().min(1, "Overview is required"),
  highlights: z.string().min(1, "Add at least one highlight"),
  universities: z.string().min(1, "Add at least one university"),
  tuition: z.string().min(1, "Tuition is required"),
  requirements: z.string().min(1, "Add at least one requirement"),
  workOptions: z.string().min(1, "Add at least one work option"),
  accent: z.string().default("from-blue-50 to-slate-50"),
  featured: z.boolean().default(true),
});

type DestinationForm = z.infer<typeof destinationSchema>;

function toLines(value: string[]) {
  return value.join("\n");
}

function toArray(value: string) {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function toPayload(values: DestinationForm) {
  return {
    ...values,
    slug: values.slug || values.name,
    highlights: toArray(values.highlights),
    universities: toArray(values.universities),
    requirements: toArray(values.requirements),
    workOptions: toArray(values.workOptions),
  };
}

export default function AdminDestinationsPage() {
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["/api/destinations"],
    queryFn: listDestinations,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<DestinationForm>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      slug: "",
      code: "",
      name: "",
      description: "",
      overview: "",
      highlights: "",
      universities: "",
      tuition: "",
      requirements: "",
      workOptions: "",
      accent: "from-blue-50 to-slate-50",
      featured: true,
    },
  });

  const resetForNew = () => {
    setEditingId(null);
    form.reset({
      slug: "",
      code: "",
      name: "",
      description: "",
      overview: "",
      highlights: "",
      universities: "",
      tuition: "",
      requirements: "",
      workOptions: "",
      accent: "from-blue-50 to-slate-50",
      featured: true,
    });
    setIsDialogOpen(true);
  };

  const editDestination = (destination: DestinationRecord) => {
    setEditingId(destination.id);
    form.reset({
      slug: destination.slug,
      code: destination.code,
      name: destination.name,
      description: destination.description,
      overview: destination.overview,
      highlights: toLines(destination.highlights),
      universities: toLines(destination.universities),
      tuition: destination.tuition,
      requirements: toLines(destination.requirements),
      workOptions: toLines(destination.workOptions),
      accent: destination.accent,
      featured: destination.featured,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: DestinationForm) => {
    setIsSaving(true);
    try {
      if (editingId) {
        await updateDestination(editingId, toPayload(values));
        toast({ title: "Destination updated" });
      } else {
        await createDestination(toPayload(values));
        toast({ title: "Destination created" });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      setIsDialogOpen(false);
      setEditingId(null);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to save destination",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this destination?")) return;
    try {
      await deleteDestination(id);
      toast({ title: "Destination deleted" });
      await queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to delete destination",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Manage Destinations</h2>
            <p className="text-muted-foreground">Edit country listing cards and Learn More pages.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForNew}><Plus className="mr-2 h-4 w-4" /> Add Destination</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Destination" : "Add Destination"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="code" render={({ field }) => (
                      <FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="CA" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="slug" render={({ field }) => (
                      <FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="canada" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Card Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="overview" render={({ field }) => (
                    <FormItem><FormLabel>Detail Page Overview</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="highlights" render={({ field }) => (
                      <FormItem><FormLabel>Key Highlights</FormLabel><FormControl><Textarea rows={6} placeholder="One per line" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="universities" render={({ field }) => (
                      <FormItem><FormLabel>Top Universities</FormLabel><FormControl><Textarea rows={6} placeholder="One per line" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="requirements" render={({ field }) => (
                      <FormItem><FormLabel>Admission Requirements</FormLabel><FormControl><Textarea rows={6} placeholder="One per line" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="workOptions" render={({ field }) => (
                      <FormItem><FormLabel>Work Options</FormLabel><FormControl><Textarea rows={6} placeholder="One per line" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="tuition" render={({ field }) => (
                      <FormItem><FormLabel>Average Tuition</FormLabel><FormControl><Input placeholder="CAD 15,000 - 35,000/year" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="accent" render={({ field }) => (
                      <FormItem><FormLabel>Accent Classes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="featured" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Visible on public destination pages</FormLabel>
                        <div className="text-sm text-muted-foreground">Turn off to hide this destination later.</div>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Destination"}
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
                <TableHead>Destination</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tuition</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {destinations.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center">No destinations found.</TableCell></TableRow>
              )}
              {destinations.map((destination) => (
                <TableRow key={destination.id}>
                  <TableCell>
                    <div className="font-medium">{destination.code} {destination.name}</div>
                    <div className="line-clamp-1 text-sm text-muted-foreground">{destination.description}</div>
                  </TableCell>
                  <TableCell>{destination.slug}</TableCell>
                  <TableCell>{destination.tuition}</TableCell>
                  <TableCell>{destination.featured ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => editDestination(destination)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(destination.id)}>
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
