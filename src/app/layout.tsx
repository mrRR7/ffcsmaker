import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/utils/cn";
import { Analytics } from "@vercel/analytics/react";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

// Since we don't have Cal Sans, we use Inter for display as well, but we'll apply tight tracking in Tailwind config or classes
const calSansFallback = Inter({
  subsets: ["latin"],
  variable: "--font-cal-sans",
  display: "swap",
  weight: ["600"]
});

export const metadata: Metadata = {
  title: "Ultimate FFCS",
  description: "Frontend-only college timetable optimizer"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We leave the HTML without 'dark' class by default, the AppShell will handle adding/removing it based on user preference
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, calSansFallback.variable, "font-sans antialiased")}>
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
