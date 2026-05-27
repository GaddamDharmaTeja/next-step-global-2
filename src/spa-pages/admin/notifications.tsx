import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSendNotification } from "@workspace/api-client-react";
import { createNotificationTemplate, listNotificationTemplates, updateNotificationTemplate } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const notificationSchema = z.object({
  channel: z.enum(["email", "whatsapp", "both"]),
  purpose: z.string().min(1, "Template usage is required"),
  recipientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  recipientPhone: z.string().optional().or(z.literal("")),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const sendNotification = useSendNotification();
  const isSending = sendNotification.isPending;
  const { data: templates = [] } = useQuery({ queryKey: ["/api/notification-templates"], queryFn: listNotificationTemplates });
  const queryClient = useQueryClient();
  const [templateName, setTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { channel: "email", purpose: "general", recipientEmail: "", recipientPhone: "", subject: "", message: "" },
  });

  const onSubmit = (values: z.infer<typeof notificationSchema>) => {
    sendNotification.mutate({
      data: {
        channel: values.channel,
        recipientEmail: values.recipientEmail || null,
        recipientPhone: values.recipientPhone || null,
        subject: values.subject,
        message: values.message,
      }
    }, {
      onSuccess: (result) => {
        toast({ title: result.message });
        form.reset();
      },
      onError: () => {
        toast({ title: "Failed to send notification", variant: "destructive" });
      }
    });
  };

  const channel = form.watch("channel");

  const loadTemplate = (templateId: string) => {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) return;
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    form.setValue("channel", template.channel);
    form.setValue("purpose", template.purpose || "general");
    form.setValue("subject", template.subject);
    form.setValue("message", template.message);
  };

  const saveCurrentAsTemplate = async () => {
    const values = form.getValues();
    try {
      const payload = {
        name: templateName || values.subject,
        channel: values.channel,
        purpose: values.purpose,
        subject: values.subject,
        message: values.message,
      };
      if (editingTemplateId) {
        await updateNotificationTemplate(editingTemplateId, payload);
      } else {
        await createNotificationTemplate(payload);
      }
      setTemplateName("");
      setEditingTemplateId(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      toast({ title: editingTemplateId ? "Template updated" : "Template saved" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save template", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Send Notifications</h2>
          <p className="text-muted-foreground">Create database-backed email and WhatsApp templates, then send or use them from inquiries.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
            <CardDescription>Fill out the details below to dispatch a notification.</CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="text-sm font-medium">Templates</div>
                <Select onValueChange={loadTemplate}>
                  <SelectTrigger><SelectValue placeholder="Load a template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>{template.name} ({template.purpose || "general"})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Template Usage</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="inquiry_email">Inquiry Email Button</SelectItem>
                        <SelectItem value="inquiry_whatsapp">Inquiry WhatsApp Button</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  {(channel === "email" || channel === "both") && (
                    <FormField control={form.control} name="recipientEmail" render={({ field }) => (
                      <FormItem><FormLabel>Recipient Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  )}
                  {(channel === "whatsapp" || channel === "both") && (
                    <FormField control={form.control} name="recipientPhone" render={({ field }) => (
                      <FormItem><FormLabel>Recipient Phone</FormLabel><FormControl><Input {...field} placeholder="+1234567890" /></FormControl><FormMessage /></FormItem>
                    )} />
                  )}
                </div>

                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl><Textarea {...field} rows={8} /></FormControl>
                    <div className="text-xs text-muted-foreground">
                      Variables: {"{{name}}"}, {"{{email}}"}, {"{{phone}}"}, {"{{subject}}"}, {"{{message}}"}, {"{{status}}"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={isSending} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? "Sending..." : "Send Notification"}
                </Button>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" />
                  <Button type="button" variant="outline" onClick={saveCurrentAsTemplate}>
                    <Edit className="mr-2 h-4 w-4" />
                    {editingTemplateId ? "Update Template" : "Save Template"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
