import { AdminLayout } from "@/components/layout/admin-layout";
import { useListPrograms, useCreateProgram, useUpdateProgram, useDeleteProgram, getListProgramsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const programSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  country: z.string().min(1, "Country is required"),
  duration: z.string().min(1, "Duration is required"),
  imageUrl: z.string().optional(),
  featured: z.boolean().default(false),
});

export default function AdminProgramsPage() {
  const { data: programs, isLoading } = useListPrograms();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const deleteProgram = useDeleteProgram();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: { title: "", description: "", country: "", duration: "", imageUrl: "", featured: false },
  });

  const onSubmit = (values: z.infer<typeof programSchema>) => {
    if (editingId) {
      updateProgram.mutate({ programId: editingId, data: values }, {
        onSuccess: () => {
          toast({ title: "Program updated" });
          queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
          setIsDialogOpen(false);
          setEditingId(null);
        }
      });
    } else {
      createProgram.mutate({ data: values }, {
        onSuccess: () => {
          toast({ title: "Program created" });
          queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
          setIsDialogOpen(false);
        }
      });
    }
  };

  const handleEdit = (program: any) => {
    setEditingId(program.id);
    form.reset({
      title: program.title,
      description: program.description,
      country: program.country,
      duration: program.duration,
      imageUrl: program.imageUrl || "",
      featured: program.featured,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    form.reset({ title: "", description: "", country: "", duration: "", imageUrl: "", featured: false });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this program?")) return;
    deleteProgram.mutate({ programId: id }, {
      onSuccess: () => {
        toast({ title: "Program deleted" });
        queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
      }
    });
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Manage Programs</h2>
            <p className="text-muted-foreground">Add and edit educational programs.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}><Plus className="h-4 w-4 mr-2" /> Add Program</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Program" : "Add New Program"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="duration" render={({ field }) => (
                      <FormItem><FormLabel>Duration</FormLabel><FormControl><Input {...field} placeholder="e.g. 2 years" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="imageUrl" render={({ field }) => (
                      <FormItem><FormLabel>Image URL (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="featured" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured Program</FormLabel>
                        <div className="text-sm text-muted-foreground">Show this program on the homepage</div>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createProgram.isPending || updateProgram.isPending}>Save Program</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="modern-admin-panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs?.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No programs found.</TableCell></TableRow>
              )}
              {programs?.map((prog) => (
                <TableRow key={prog.id}>
                  <TableCell>
                    <div className="font-medium">{prog.title}</div>
                  </TableCell>
                  <TableCell>{prog.country}</TableCell>
                  <TableCell>{prog.duration}</TableCell>
                  <TableCell>{prog.featured ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(prog)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(prog.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
