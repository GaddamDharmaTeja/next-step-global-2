import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { ArrowRight, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    try {
      const user = await signIn(values);
      await queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      toast({ title: "Signed in successfully" });
      setLocation(user.role === "admin" ? "/admin" : "/user-portal");
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#081120] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,47,109,0.35),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(217,163,26,0.22),_transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="relative mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-2xl">
            <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
              <BrandLogo
                frameClassName="flex h-[56px] items-center rounded-xl bg-white px-3"
                imageClassName="h-10 w-auto max-w-[170px] object-contain"
              />
              NextStep Global
            </Link>

            <div className="mt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9a31a]/25 bg-[#d9a31a]/10 px-4 py-2 text-sm font-semibold text-[#f3cf73]">
                <Sparkles className="h-4 w-4" />
                Student portal and admin access
              </div>

              <h1 className="mt-8 font-serif text-6xl font-bold leading-[1.02] text-white">
                Continue your global education journey with clarity.
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
                Access your applications, inquiries, counseling updates, and planning tools in one focused workspace built for students and advisors.
              </p>
            </div>

            <div className="mt-12 grid max-w-xl gap-4">
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="rounded-xl bg-[#173f86]/25 p-3 text-[#a8c4f3]">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-white">Real destination planning</div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Track study options, admissions progress, and university choices without losing momentum.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="rounded-xl bg-[#e4aa19]/15 p-3 text-[#f6ca68]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-white">Secure account access</div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Sign in to manage student data, documents, and communication from a protected dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-xl rounded-[28px] border border-white/12 bg-white/95 text-[#0f1b2f] shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
            <CardHeader className="space-y-5 px-7 pb-2 pt-7 sm:px-8 sm:pt-8">
              <div className="flex items-center justify-between">
                <Link href="/" className="inline-flex items-center gap-3 lg:hidden">
                  <BrandLogo
                    frameClassName="flex h-[58px] items-center rounded-xl bg-white px-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                    imageClassName="h-10 w-auto max-w-[170px] object-contain"
                  />
                </Link>
                <div className="rounded-full bg-[#eef3fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#a77400]">
                  Sign In
                </div>
              </div>

              <div>
                <CardTitle className="font-serif text-4xl font-bold text-[#07162f]">
                  Welcome back
                </CardTitle>
                <CardDescription className="mt-3 max-w-md text-base leading-7 text-slate-600">
                  Use your account to access the student portal or admin dashboard and continue from where you left off.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-7 pb-7 pt-4 sm:px-8 sm:pb-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-[#24334f]">Email address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="h-12 rounded-xl border-slate-200 bg-white text-base shadow-none focus-visible:ring-[#d9a31a]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-semibold text-[#24334f]">Password</FormLabel>
                        <Link href="/forgot-password" className="text-xs font-semibold text-[#0e2f6d] hover:text-[#17458d]">Forgot password?</Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          className="h-12 rounded-xl border-slate-200 bg-white text-base shadow-none focus-visible:ring-[#d9a31a]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    className="h-13 w-full rounded-xl border border-[#0e2f6d] bg-[#d9a31a] text-base font-semibold text-[#081120] shadow-none transition hover:bg-[#c79414]"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Signing in..." : "Enter dashboard"}
                    {!form.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </Form>

              <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link href="/sign-up" className="font-semibold text-[#0e2f6d] hover:text-[#17458d]">
                  Create account
                </Link>
                <Link href="/" className="text-slate-500 hover:text-[#121d32]">
                  Back to homepage
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
