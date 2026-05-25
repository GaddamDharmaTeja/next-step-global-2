import { AdminLayout } from "@/components/layout/admin-layout";
import { useListTestimonials, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial, getListTestimonialsQueryKey } from "@workspace/api-client-react";
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

const testimonialSchema = z.object({
  studentName: z.string().min(1, "Name required"),
  country: z.string().min(1, "Country required"),
  program: z.string().optional(),
  message: z.string().min(1, "Message required"),
  avatarUrl: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).default(5),
  featured: z.boolean().default(false),
});

export default function AdminTestimonialsPage() {
  const { data: testimonials, isLoading } = useListTestimonials();
  const createTestimonial = useCreateTestimonial();
  const updateTestimonial = useUpdateTestimonial();
  const deleteTestimonial = useDeleteTestimonial();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { studentName: "", country: "", program: "", message: "", avatarUrl: "", rating: 5, featured: false },
  });

  const onSubmit = (values: z.infer<typeof testimonialSchema>) => {
    if (editingId) {
      updateTestimonial.mutate({ testimonialId: editingId, data: values }, {
        onSuccess: () => {
          toast({ title: "Testimonial updated" });
          queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
          setIsDialogOpen(false);
          setEditingId(null);
        }
      });
    } else {
      createTestimonial.mutate({ data: values }, {
        onSuccess: () => {
          toast({ title: "Testimonial added" });
          queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
          setIsDialogOpen(false);
        }
      });
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    form.reset({ studentName: "", country: "", program: "", message: "", avatarUrl: "", rating: 5, featured: false });
    setIsDialogOpen(true);
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    form.reset({
      studentName: t.studentName,
      country: t.country,
      program: t.program || "",
      message: t.message,
      avatarUrl: t.avatarUrl || "",
      rating: t.rating,
      featured: t.featured,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete testimonial?")) return;
    deleteTestimonial.mutate({ testimonialId: id }, {
      onSuccess: () => {
        toast({ title: "Testimonial deleted" });
        queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
      }
    });
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Manage Testimonials</h2>
            <p className="text-muted-foreground">Add success stories from students.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}><Plus className="h-4 w-4 mr-2" /> Add Testimonial</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="studentName" render={({ field }) => (
                      <FormItem><FormLabel>Student Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem><FormLabel>Destination Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="program" render={({ field }) => (
                    <FormItem><FormLabel>Program</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="rating" render={({ field }) => (
                      <FormItem><FormLabel>Rating (1-5)</FormLabel><FormControl><Input type="number" min="1" max="5" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="avatarUrl" render={({ field }) => (
                      <FormItem><FormLabel>Avatar URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="featured" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-base">Featured</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full">Save</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Country / Program</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials?.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-8">No testimonials found.</TableCell></TableRow>
              )}
              {testimonials?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.studentName}</TableCell>
                  <TableCell>{t.country} {t.program ? `- ${t.program}` : ''}</TableCell>
                  <TableCell>{t.rating} / 5</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
