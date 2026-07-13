import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, ImageIcon, Search, Trash2, Upload } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { assetUrl } from "@/lib/runtime";
import {
  deleteAdminMedia,
  listAdminMedia,
  updateAdminMedia,
  uploadAdminMedia,
  type MediaFileRecord,
} from "@/lib/api";

function formatBytes(value?: number | null) {
  if (!value) return "Unknown size";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [search, setSearch] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("admin-media");
  const [preview, setPreview] = useState<MediaFileRecord | null>(null);
  const [editing, setEditing] = useState<MediaFileRecord | null>(null);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = useMemo(() => ["/api/admin/media/list", search] as const, [search]);
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => listAdminMedia({ search }),
  });
  const media = data?.media || [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/media/list"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadAdminMedia({ file, caption, category });
      setCaption("");
      toast({ title: "Image uploaded" });
      await refresh();
    } catch (uploadError) {
      toast({
        title: uploadError instanceof Error ? uploadError.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: MediaFileRecord) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await deleteAdminMedia(item.id);
      toast({ title: "Image deleted" });
      await refresh();
    } catch (deleteError) {
      toast({
        title: deleteError instanceof Error ? deleteError.message : "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await updateAdminMedia(editing.id, {
        name: editing.name,
        url: editing.url,
        caption: editing.caption || "",
        category: editing.category || "",
        file: replacementFile,
      });
      toast({ title: "Image updated" });
      setEditing(null);
      setReplacementFile(null);
      await refresh();
    } catch (updateError) {
      toast({
        title: updateError instanceof Error ? updateError.message : "Failed to update image",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#101b31] px-6 py-7 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">Media Manager</div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">Manage uploaded images.</h2>
              <p className="mt-3 max-w-2xl text-slate-200">
                Upload, preview, replace metadata, delete, and search existing image files from one admin workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
              <div className="text-sm text-slate-300">Visible media</div>
              <div className="mt-2 text-3xl font-semibold">{data?.total || 0}</div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Upload image</label>
            <Input type="file" accept="image/jpeg,image/png,image/webp" disabled={isUploading} onChange={(event) => handleUpload(event.target.files?.[0] || null)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption" />
            <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" />
          </div>
          <Button disabled={isUploading} className="gap-2">
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Ready"}
          </Button>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search images, users, categories..." />
          </div>
          <div className="text-sm text-slate-500">
            JPG, JPEG, PNG, and WEBP supported. Old files in `uploads/gallery` are included automatically.
          </div>
        </div>

        {isLoading && <div className="modern-admin-panel p-8 text-sm text-slate-500">Loading media...</div>}
        {isError && <div className="modern-admin-panel p-8 text-sm text-red-600">{error instanceof Error ? error.message : "Failed to load media"}</div>}
        {!isLoading && !isError && media.length === 0 && (
          <div className="modern-admin-panel flex flex-col items-center justify-center p-12 text-center">
            <ImageIcon className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No images found</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">Upload an image or clear the search filter to view existing media.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {media.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
              <button type="button" className="block h-52 w-full bg-slate-100" onClick={() => setPreview(item)}>
                <img src={assetUrl(item.url)} alt={item.caption || item.name} className="h-full w-full object-cover" />
              </button>
              <div className="space-y-3 p-4">
                <div>
                  <div className="truncate font-semibold text-slate-900">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{formatBytes(item.sizeBytes)} / {item.contentType || "image"}</div>
                </div>
                <div className="text-xs leading-5 text-slate-500">
                  <div>Uploaded by {item.uploadedByName || "Unknown"}</div>
                  <div>{new Date(item.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => setEditing(item)}>
                    <Edit3 className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="gap-2" onClick={() => handleDelete(item)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>
            {preview && (
              <div className="space-y-4">
                <img src={assetUrl(preview.url)} alt={preview.caption || preview.name} className="max-h-[70vh] w-full rounded-lg object-contain" />
                <Input readOnly value={assetUrl(preview.url)} />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(editing)} onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setReplacementFile(null);
          }
        }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Image</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <img src={assetUrl(editing.url)} alt={editing.caption || editing.name} className="h-56 w-full rounded-lg bg-slate-100 object-cover" />
                <Input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="Image name" />
                <Input value={editing.url} onChange={(event) => setEditing({ ...editing, url: event.target.value })} placeholder="Image URL" />
                <Input value={editing.caption || ""} onChange={(event) => setEditing({ ...editing, caption: event.target.value })} placeholder="Caption" />
                <Input value={editing.category || ""} onChange={(event) => setEditing({ ...editing, category: event.target.value })} placeholder="Category" />
                <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setReplacementFile(event.target.files?.[0] || null)} />
                {replacementFile && <div className="text-sm text-slate-500">Replacement selected: {replacementFile.name}</div>}
                <Button onClick={handleSaveEdit} className="w-full">Save Image</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
