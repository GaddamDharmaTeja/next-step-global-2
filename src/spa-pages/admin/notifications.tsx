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
import { KeyRound, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listNotificationTemplates } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const notificationSchema = z.object({
  channel: z.enum(["email", "whatsapp", "both"]),
  purpose: z.string().min(1, "Template usage is required"),
  recipientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  recipientPhone: z.string().optional().or(z.literal("")),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

function applyNotificationVariables(
  value: string,
  values: z.infer<typeof notificationSchema>,
  templateName: string,
) {
  const recipientEmail = values.recipientEmail || "";
  const recipientPhone = values.recipientPhone || "";
  const nameFromEmail = recipientEmail ? recipientEmail.split("@")[0] : "";
  const variables: Record<string, string> = {
    name: templateName || nameFromEmail || recipientPhone || "there",
    email: recipientEmail,
    phone: recipientPhone,
    whatsapp: recipientPhone,
    subject: values.subject || "",
    message: values.message || "",
    status: "",
  };

  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => variables[key] ?? "");
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const { data: templates = [] } = useQuery({ queryKey: ["/api/notification-templates"], queryFn: listNotificationTemplates });

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { channel: "email", purpose: "general", recipientEmail: "", recipientPhone: "", subject: "", message: "" },
  });

  const onSubmit = (values: z.infer<typeof notificationSchema>) => {
    const opened: string[] = [];
    const resolvedSubject = applyNotificationVariables(values.subject, values, "");
    const resolvedMessage = applyNotificationVariables(values.message, values, "");
    const recipientEmail = values.recipientEmail || "";
    const recipientPhone = values.recipientPhone || "";
    const shouldOpenEmail = (values.channel === "email" || values.channel === "both") && recipientEmail;
    const shouldOpenWhatsApp = (values.channel === "whatsapp" || values.channel === "both") && recipientPhone;

    if (shouldOpenWhatsApp) {
      const phone = recipientPhone.replace(/\D/g, "");
      if (phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(resolvedMessage)}`, "_blank", "noopener,noreferrer");
        opened.push("WhatsApp");
      }
    }

    if (shouldOpenEmail) {
      const mailLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(resolvedSubject)}&body=${encodeURIComponent(resolvedMessage)}`;
      window.open(mailLink, "_self");
      opened.push("email");
    }

    if (opened.length === 0) {
      toast({ title: "Add an email or phone number for the selected channel", variant: "destructive" });
      return;
    }

    toast({ title: `Opened ${opened.join(" and ")} locally` });
  };

  const channel = form.watch("channel");

  const generateOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    form.setValue("subject", "Your NextStep verification code");
    form.setValue(
      "message",
      `Your NextStep verification code is ${code}. This code is valid for 10 minutes. Do not share it with anyone.`,
    );
    toast({ title: "OTP generated" });
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) return;
    form.setValue("channel", template.channel);
    form.setValue("purpose", template.purpose || "general");
    form.setValue("subject", template.subject);
    form.setValue("message", template.message);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Send Notifications</h2>
          <p className="text-muted-foreground">Load a saved template, add recipient details, and open local email or WhatsApp.</p>
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
                    {templates.map((template, index) => (
                      <SelectItem key={`${template.id}-${index}`} value={template.id}>{template.name} ({template.purpose || "general"})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Button type="button" variant="outline" className="w-full" onClick={generateOtp}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Generate OTP Message
                </Button>

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
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl><Textarea {...field} rows={8} /></FormControl>
                    <div className="text-xs text-muted-foreground">
                      Variables: {"{{name}}"}, {"{{email}}"}, {"{{phone}}"}, {"{{subject}}"}, {"{{message}}"}, {"{{status}}"}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
