"use client";
import { useState } from "react";
import Link from 'next/link';
import { Button } from "@/components/customButton";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "./brandLogo";

type NavbarProps = {
    active?: "home" | "services" | "destinations" | "consultants" | "about" | "contact";
    variant?: "default" | "overlay";
};

function navClass(isActive: boolean, variant: "default" | "overlay") {
    if (variant === "overlay") {
        return isActive ? "text-white" : "text-white/78 transition-colors hover:text-white";
    }

    return isActive ? "text-[#0e2f6d]" : "transition-colors hover:text-[#0e2f6d]";
}

const navItems = [
    { key: "home", href: "/", label: "Home" },
    { key: "services", href: "/services", label: "Services" },
    { key: "destinations", href: "/destinations", label: "Destinations" },
    { key: "consultants", href: "/consultants", label: "Consultants" },
    { key: "about", href: "/about", label: "About" },
    { key: "contact", href: "/contact", label: "Contact" },
] as const;

export default function Navbar({ active, variant = "default" }: NavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const isOverlay = variant === "overlay";

    return (
        <nav
            className={
                isOverlay
                    ? "absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-transparent"
                    : "sticky top-0 z-50 border-b border-[#d9dee8] bg-white/98 backdrop-blur"
            }
        >
            <div className="mx-auto flex min-h-[92px] max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-5 lg:px-8">
                <Link href="/" className="flex min-w-0 items-center">
                    <BrandLogo
                        frameClassName={
                            isOverlay
                                ? "flex h-[64px] items-center rounded-2xl border border-white/12 bg-white/92 px-3 shadow-[0_14px_34px_rgba(8,17,32,0.24)] backdrop-blur sm:px-4"
                                : "flex h-[64px] items-center rounded-2xl bg-white px-3 sm:px-4"
                        }
                        imageClassName="h-11 w-auto max-w-[180px] object-contain sm:h-14 sm:max-w-[280px]"
                    />
                </Link>

                <div className="hidden items-center gap-8 text-base font-medium text-slate-600 md:flex">
                    {navItems.map((item) => (
                        <Link key={item.key} href={item.href} className={navClass(active === item.key, variant)}>
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <Link
                        href="/sign-in"
                        className={
                            isOverlay
                                ? "hidden text-base font-medium text-white/78 transition-colors hover:text-white sm:block"
                                : "hidden text-base font-medium text-slate-600 hover:text-[#0e2f6d] sm:block"
                        }
                    >
                        Portal
                    </Link>
                    <Link href="/contact">
                        <Button className="h-12 rounded-md border border-[#c79414] bg-[#d9a31a] px-5 text-base font-semibold text-[#081120] shadow-[0_16px_30px_rgba(217,163,26,0.2)] hover:bg-[#c79414]">
                            Free Assessment
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center gap-2 md:hidden">
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
                                className={`flex min-h-12 items-center rounded-lg px-4 text-base font-medium ${active === item.key
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
                                Portal
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
