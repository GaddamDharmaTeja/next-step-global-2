import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "NextStep Global",
  description: "NextStep Global study abroad platform",
  icons: {
    icon: "/nextstep-icon.png",
    shortcut: "/nextstep-icon.png",
    apple: "/nextstep-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
