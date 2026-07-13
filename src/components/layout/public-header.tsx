"use client";

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, Menu, Moon, Search, Sun, UserRound, X } from "lucide-react";
import { BrandLogo } from "./brand-logo";

type PublicHeaderProps = {
  active?: "home" | "services" | "destinations" | "consultants" | "about" | "contact" | "portal";
  variant?: "default" | "overlay";
};

function navClass(isActive: boolean, variant: "default" | "overlay") {
  if (variant === "overlay") {
    return isActive
      ? "rounded-full bg-white/14 px-3 py-2 text-white"
      : "rounded-full px-3 py-2 text-white/82 transition-colors hover:bg-white/10 hover:text-white";
  }

  return isActive
    ? "rounded-full bg-[#0e2f6d]/10 px-3 py-2 text-[#0e2f6d]"
    : "rounded-full px-3 py-2 transition-colors hover:bg-slate-100 hover:text-[#0e2f6d]";
}

const navItems = [
  { key: "home", href: "/", label: "Home" },
  { key: "services", href: "/services", label: "Services" },
  { key: "destinations", href: "/destinations", label: "Destinations" },
  { key: "consultants", href: "/consultants", label: "Consultants" },
  { key: "about", href: "/about", label: "About" },
  { key: "contact", href: "/contact", label: "Contact" },
  { key: "portal", href: "/portal", label: "Portal" },
] as const;

export function PublicHeader({ active, variant = "default" }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const isOverlay = variant === "overlay";
  const iconButtonClass = isOverlay
    ? "h-9 w-9 rounded-full text-white/82 hover:bg-white/10 hover:text-white"
    : "h-9 w-9 rounded-full text-slate-600 hover:bg-slate-100 hover:text-[#0e2f6d]";

  useEffect(() => {
    const enabled = localStorage.getItem("nextstep-theme") === "dark";
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("nextstep-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <nav
      className={
        isOverlay
          ? "absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-transparent"
          : "sticky top-0 z-50 border-b border-white/70 bg-white/88 shadow-[0_14px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl"
      }
    >
      <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-7">
        <Link href="/" className="flex min-w-0 items-center">
          <BrandLogo
            frameClassName={
              isOverlay
                ? "flex h-[52px] items-center rounded-xl border border-white/12 bg-white/95 px-3 shadow-lg backdrop-blur"
                : "flex h-[52px] items-center rounded-xl bg-white px-2"
            }
            imageClassName="h-10 w-auto max-w-[145px] object-contain sm:max-w-[170px]"
          />
        </Link>

        <div className="hidden min-w-0 items-center gap-0.5 text-sm font-semibold text-slate-600 lg:flex">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href} className={navClass(active === item.key, variant)}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
          {[{ label: "Search", icon: Search }, { label: "Notifications", icon: Bell }].map(({ label, icon: Icon }) => (
            <Button key={label} variant="ghost" size="icon" className={`hidden 2xl:inline-flex ${iconButtonClass}`} aria-label={label} title={label}>
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          <Button variant="ghost" size="icon" className={`hidden 2xl:inline-flex ${iconButtonClass}`} onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link
            href="/sign-in"
            className={
              isOverlay
                ? "inline-flex shrink-0 items-center whitespace-nowrap text-sm font-semibold text-white/82 transition-colors hover:text-white"
                : "inline-flex shrink-0 items-center whitespace-nowrap text-sm font-semibold text-slate-600 hover:text-[#0e2f6d]"
            }
          >
            <UserRound className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Sign in</span>
          </Link>
          <Link href="/contact">
            <Button className="h-11 whitespace-nowrap rounded-xl border border-[#c79414] bg-[#d9a31a] px-4 text-sm font-bold text-[#081120] shadow-[0_16px_30px_rgba(217,163,26,0.22)] transition hover:-translate-y-0.5 hover:bg-[#c79414] 2xl:px-5">
              Free Assessment
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/contact">
            <Button className="h-11 rounded-md border border-[#0e2f6d] bg-[#d9a31a] px-4 text-sm font-semibold text-[#081120] shadow-none hover:bg-[#c79414]">
              Assess
            </Button>
          </Link>

          <Button
            variant="outline"
            size="icon"
            className={
              isOverlay
                ? "h-11 w-11 rounded-md border-white/18 bg-white/12 text-white shadow-none backdrop-blur hover:bg-white/18"
                : "h-11 w-11 rounded-md border-slate-300 bg-white text-[#0e2f6d] shadow-none hover:bg-slate-50"
            }
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0c224a]/94 px-4 py-4 text-white shadow-sm backdrop-blur md:hidden">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`flex min-h-12 items-center rounded-lg px-4 text-base font-medium ${
                  active === item.key
                    ? "bg-white/14 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
            <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="h-12 w-full rounded-md border-white/20 bg-transparent text-base font-semibold text-white shadow-none hover:bg-white/10">
                Sign in
              </Button>
            </Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)}>
              <Button className="h-12 w-full rounded-md border border-[#0e2f6d] bg-[#d9a31a] text-base font-semibold text-[#081120] shadow-none hover:bg-[#c79414]">
                Free Assessment
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
