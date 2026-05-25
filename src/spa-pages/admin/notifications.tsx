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
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSendNotification } from "@workspace/api-client-react";
import { createNotificationTemplate, listNotificationTemplates, updateNotificationTemplate } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const notificationSchema = z.object({
  channel: z.enum(["email", "whatsapp", "both"]),
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

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { channel: "email", recipientEmail: "", recipientPhone: "", subject: "", message: "" },
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
  const selectedTemplateId = form.watch("subject");

  const saveCurrentAsTemplate = async () => {
    const values = form.getValues();
    try {
      await createNotificationTemplate({
        name: templateName || values.subject,
        channel: values.channel,
        subject: values.subject,
        message: values.message,
      });
      setTemplateName("");
      await queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      toast({ title: "Template saved" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to save template", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Send Notifications</h2>
          <p className="text-muted-foreground">Send updates directly to students via Email or WhatsApp.</p>
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
                <Select onValueChange={(templateId) => {
                  const template = templates.find((entry) => entry.id === templateId);
                  if (!template) return;
                  form.setValue("channel", template.channel);
                  form.setValue("subject", template.subject);
                  form.setValue("message", template.message);
                }}>
                  <SelectTrigger><SelectValue placeholder="Load a template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
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
                  <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea {...field} rows={6} /></FormControl><FormMessage /></FormItem>
                )} />

                <Button type="submit" disabled={isSending} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? "Sending..." : "Send Notification"}
                </Button>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" />
                  <Button type="button" variant="outline" onClick={saveCurrentAsTemplate}>Save Template</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
