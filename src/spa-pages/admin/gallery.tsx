import { AdminLayout } from "@/components/layout/admin-layout";
import { useListGalleryImages, useDeleteGalleryImage, getListGalleryImagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { uploadGalleryImage } from "@/lib/api";

const gallerySchema = z.object({
  caption: z.string().optional(),
  category: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  file: z.instanceof(File, { message: "Please select an image" }),
});

export default function AdminGalleryPage() {
  const { data: images, isLoading } = useListGalleryImages();
  const deleteGalleryImage = useDeleteGalleryImage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof gallerySchema>>({
    resolver: zodResolver(gallerySchema),
    defaultValues: { caption: "", category: "", sortOrder: 0 },
  });

  const onSubmit = async (values: z.infer<typeof gallerySchema>) => {
    try {
      await uploadGalleryImage(values);
      toast({ title: "Image added to gallery" });
      await queryClient.invalidateQueries({ queryKey: getListGalleryImagesQueryKey() });
      setIsDialogOpen(false);
      form.reset({ caption: "", category: "", sortOrder: 0 });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this image?")) return;
    deleteGalleryImage.mutate({ imageId: id }, {
      onSuccess: () => {
        toast({ title: "Image deleted" });
        queryClient.invalidateQueries({ queryKey: getListGalleryImagesQueryKey() });
      }
    });
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gallery</h2>
            <p className="text-muted-foreground">Manage campus and student photos.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Image</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Gallery Image</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="caption" render={({ field }) => (
                    <FormItem><FormLabel>Caption</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="file" render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Image File</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          value=""
                          onChange={(event) => onChange(event.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} placeholder="e.g. campus, students" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="sortOrder" render={({ field }) => (
                    <FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Uploading..." : "Save Image"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {images?.length === 0 ? (
          <div className="text-center py-12 border rounded-md bg-white text-muted-foreground">
            No gallery images found.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images?.map((img) => (
              <div key={img.id} className="group relative border rounded-md overflow-hidden bg-white aspect-square">
                <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                  <div className="text-white text-sm font-medium">{img.caption}</div>
                  <div className="flex justify-end">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(img.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
