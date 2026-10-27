import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/sora";
import "./globals.css";
import { Backdrop } from "@/components/shell/Backdrop";
import { Taskbar } from "@/components/shell/Taskbar";

export const metadata: Metadata = {
  title: { default: "Cryptic Inc.", template: "%s · Cryptic Inc." },
  description: "Every project Cryptic Inc. has shipped, how we built it with AI, and how to run it yourself.",
};

export const viewport: Viewport = { themeColor: "#07060c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <Backdrop />
        <main id="main" className="pb-28">
          {children}
        </main>
        <Taskbar />
      </body>
    </html>
  );
}
