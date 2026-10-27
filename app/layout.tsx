import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/sora";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Cryptic Inc.", template: "%s · Cryptic Inc." },
  description: "Every project Cryptic Inc. has shipped, how we built it with AI, and how to run it yourself.",
};

export const viewport: Viewport = { themeColor: "#07060c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
