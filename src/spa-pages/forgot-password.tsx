import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await resetPassword({ email: values.email, password: values.password });
      toast({ title: "Password updated. Please sign in." });
      setLocation("/sign-in");
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to reset password", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(135deg,#081120_0%,#0e2f6d_55%,#f6f8fb_55%,#ffffff_100%)] px-5 py-10">
      <Card className="w-full max-w-lg rounded-[28px] border-white/60 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
        <CardHeader className="space-y-5 p-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex">
              <BrandLogo
                frameClassName="flex h-[58px] items-center rounded-xl bg-white px-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                imageClassName="h-10 w-auto max-w-[170px] object-contain"
              />
            </Link>
            <div className="rounded-2xl bg-[#eef3fb] p-3 text-[#0e2f6d]">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>
          <div>
            <CardTitle className="text-4xl font-semibold tracking-tight text-[#07162f]">Reset password</CardTitle>
            <CardDescription className="mt-3 text-base leading-7 text-slate-600">
              Enter your account email and choose a new password.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl><Input type="email" autoComplete="email" className="h-12 rounded-xl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl><Input type="password" autoComplete="new-password" className="h-12 rounded-xl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl><Input type="password" autoComplete="new-password" className="h-12 rounded-xl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="h-12 w-full rounded-xl" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Updating..." : "Update password"}
              </Button>
            </form>
          </Form>
          <Link href="/sign-in" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0e2f6d]">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
