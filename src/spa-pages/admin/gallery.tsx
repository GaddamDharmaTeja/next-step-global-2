import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Pencil, Plus, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  deleteGalleryImageManual,
  listGalleryImagesManual,
  updateGalleryImageManual,
  uploadGalleryImage,
  type GalleryUploadResult,
} from "@/lib/api";
import { applyImageFallback, assetUrl } from "@/lib/runtime";

const galleryQueryKey = ["/api/gallery"];
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function emptyEditState(image?: GalleryUploadResult | null) {
  return {
    id: image?.id ?? 0,
    url: image?.url ?? "",
    caption: image?.caption ?? "",
    category: image?.category ?? "",
    sortOrder: image?.sortOrder ?? 0,
    file: null as File | null,
  };
}

export default function AdminGalleryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(emptyEditState());
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPreview, setEditPreview] = useState("");

  const { data: images = [], isLoading, isError, refetch } = useQuery({
    queryKey: galleryQueryKey,
    queryFn: listGalleryImagesManual,
  });

  const filteredImages = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return images;
    return images.filter((image) =>
      [image.id, image.url, image.relativeUrl, image.caption, image.category, image.uploadedByName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [images, search]);

  const resetUpload = () => {
    setUploadFile(null);
    setUploadPreview("");
    setCaption("");
    setCategory("");
    setSortOrder("0");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const chooseUploadFile = (file?: File | null) => {
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      toast({ title: "Please choose a JPG, PNG, or WEBP image", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Please choose an image smaller than 15MB", variant: "destructive" });
      return;
    }
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast({ title: "Choose an image first", variant: "destructive" });
      return;
    }
    try {
      setIsUploading(true);
      setUploadProgress(35);
      await uploadGalleryImage({
        file: uploadFile,
        caption,
        category,
        sortOrder: Number(sortOrder) || 0,
      });
      setUploadProgress(100);
      toast({ title: "Image uploaded" });
      await queryClient.invalidateQueries({ queryKey: galleryQueryKey });
      setIsDialogOpen(false);
      resetUpload();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const openEditor = (image: GalleryUploadResult) => {
    setEditingImage(emptyEditState(image));
    setEditPreview("");
    setIsEditOpen(true);
  };

  const handleEditFile = (file?: File | null) => {
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      toast({ title: "Please choose a JPG, PNG, or WEBP image", variant: "destructive" });
      return;
    }
    setEditingImage((current) => ({ ...current, file }));
    setEditPreview(URL.createObjectURL(file));
  };

  const handleEditSave = async () => {
    if (!editingImage.id) return;
    try {
      await updateGalleryImageManual(editingImage.id, {
        url: editingImage.url,
        caption: editingImage.caption,
        category: editingImage.category,
        sortOrder: editingImage.sortOrder,
        file: editingImage.file,
      });
      toast({ title: "Image updated" });
      await queryClient.invalidateQueries({ queryKey: galleryQueryKey });
      setIsEditOpen(false);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update image", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this image?")) return;
    try {
      await deleteGalleryImageManual(id);
      toast({ title: "Image deleted" });
      await queryClient.invalidateQueries({ queryKey: galleryQueryKey });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to delete image", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gallery Management</h2>
            <p className="text-muted-foreground">View, upload, replace, and organize campus and student photos.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-wrap lg:justify-end">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search images" className="w-full pl-9 sm:w-72" />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetUpload(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Image</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Gallery Image</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div
                    className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:bg-slate-100"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      chooseUploadFile(event.dataTransfer.files?.[0]);
                    }}
                  >
                    {uploadPreview ? (
                      <img src={uploadPreview} alt="Selected upload preview" className="max-h-60 rounded-md object-contain" onError={applyImageFallback} />
                    ) : (
                      <>
                        <Upload className="h-9 w-9 text-slate-500" />
                        <div className="mt-3 font-medium text-slate-900">Drop image here or click to choose</div>
                        <div className="mt-1 text-sm text-slate-500">JPG, PNG, or WEBP up to 15MB</div>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseUploadFile(event.target.files?.[0])} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption" />
                    <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" />
                    <Input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} placeholder="Sort order" />
                  </div>
                  {isUploading && <Progress value={uploadProgress} />}
                  <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border bg-white shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading gallery images...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-600">Gallery images could not be loaded.</div>
          ) : filteredImages.length === 0 ? (
            <div className="p-10 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
              <div className="mt-3 font-medium text-slate-900">No gallery images found</div>
              <div className="mt-1 text-sm text-slate-500">Upload a new image or adjust your search.</div>
            </div>
          ) : (
            <Table className="min-w-[1080px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 px-4">ID</TableHead>
                  <TableHead className="w-32">Image preview</TableHead>
                  <TableHead className="w-72">URL</TableHead>
                  <TableHead className="w-36">Category</TableHead>
                  <TableHead className="w-48">Caption</TableHead>
                  <TableHead className="w-44">Created date</TableHead>
                  <TableHead className="w-48 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImages.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell className="px-4 font-medium">{image.id}</TableCell>
                    <TableCell>
                      <button type="button" className="block overflow-hidden rounded-md border bg-slate-100" onClick={() => openEditor(image)}>
                        <img src={assetUrl(image.url)} alt={image.caption || image.name || "Gallery image"} className="h-16 w-24 object-cover" onError={applyImageFallback} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="truncate text-xs text-slate-600" title={image.url}>{image.url}</div>
                    </TableCell>
                    <TableCell>{image.category || "Uncategorized"}</TableCell>
                    <TableCell><div className="truncate" title={image.caption || ""}>{image.caption || "No caption"}</div></TableCell>
                    <TableCell className="leading-5">{formatDate(image.createdAt)}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <Button variant="secondary" size="sm" onClick={() => openEditor(image)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(image.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Gallery Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border bg-slate-100">
                <img src={editPreview || assetUrl(editingImage.url)} alt={editingImage.caption || "Gallery preview"} className="h-72 w-full object-contain" onError={applyImageFallback} />
              </div>
              <Input value={editingImage.url} onChange={(event) => setEditingImage({ ...editingImage, url: event.target.value })} placeholder="Image URL" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Input value={editingImage.caption} onChange={(event) => setEditingImage({ ...editingImage, caption: event.target.value })} placeholder="Caption" />
                <Input value={editingImage.category} onChange={(event) => setEditingImage({ ...editingImage, category: event.target.value })} placeholder="Category" />
                <Input type="number" value={editingImage.sortOrder} onChange={(event) => setEditingImage({ ...editingImage, sortOrder: Number(event.target.value) || 0 })} placeholder="Sort order" />
              </div>
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleEditFile(event.target.files?.[0])} />
              <Button onClick={handleEditSave} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
