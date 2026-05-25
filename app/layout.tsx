import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextStep Global - Study Abroad Guidance",
  description: "Global education guidance shaped by mentorship, clarity, and long-term student outcomes.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
