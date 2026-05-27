import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createNotificationTemplate, listNotificationTemplates, updateNotificationTemplate, type NotificationTemplateRecord } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  channel: z.enum(["email", "whatsapp", "both"]),
  purpose: z.string().min(1, "Template usage is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type TemplateForm = z.infer<typeof templateSchema>;

const defaults: TemplateForm = {
  name: "",
  channel: "email",
  purpose: "general",
  subject: "",
  message: "",
};

export default function AdminTemplatesPage() {
  const { data: templates = [], isLoading } = useQuery({ queryKey: ["/api/notification-templates"], queryFn: listNotificationTemplates });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: defaults,
  });

  const editTemplate = (template: NotificationTemplateRecord) => {
    setEditingId(template.id);
    form.reset({
      name: template.name,
      channel: template.channel,
      purpose: template.purpose || "general",
      subject: template.subject,
      message: template.message,
    });
  };

  const newTemplate = () => {
    setEditingId(null);
    form.reset(defaults);
  };

  const onSubmit = async (values: TemplateForm) => {
    try {
      if (editingId) {
        await updateNotificationTemplate(editingId, values);
        toast({ title: "Template updated" });
      } else {
        await createNotificationTemplate(values);
        toast({ title: "Template created" });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      newTemplate();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save template", variant: "destructive" });
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Template" : "Create Template"}</CardTitle>
            <CardDescription>Templates are stored in the database and reused by notifications and inquiry actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Template Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="channel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="purpose" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="general">General Notification</SelectItem>
                        <SelectItem value="inquiry_email">Inquiry Email Button</SelectItem>
                        <SelectItem value="inquiry_whatsapp">Inquiry WhatsApp Button</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl><Textarea {...field} rows={9} /></FormControl>
                    <div className="text-xs text-muted-foreground">
                      Variables: {"{{name}}"}, {"{{email}}"}, {"{{phone}}"}, {"{{subject}}"}, {"{{message}}"}, {"{{status}}"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <Button type="submit">{editingId ? "Update Template" : "Save Template"}</Button>
                  <Button type="button" variant="outline" onClick={newTemplate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Templates</CardTitle>
            <CardDescription>Select a template to edit it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length === 0 && <div className="text-sm text-muted-foreground">No templates saved yet.</div>}
            {templates.map((template, index) => (
              <button
                key={`${template.id}-${index}`}
                type="button"
                onClick={() => editTemplate(template)}
                className="w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-[#173f86] hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900">{template.name}</div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{template.channel}</Badge>
                    <Badge variant="secondary">{template.purpose || "general"}</Badge>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-slate-700">{template.subject}</div>
                <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.message}</div>
                <div className="mt-3 inline-flex items-center text-xs font-medium text-[#173f86]">
                  <Edit className="mr-1 h-3.5 w-3.5" />
                  Edit template
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
