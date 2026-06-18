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
  title: 'Ultimate FFCS | VIT Timetable Generator',
  description: 'Generate every valid FFCS timetable combination automatically. Set your constraints, pick your professors, and get ranked results instantly. Free for VIT Chennai and VIT AP students.',
  keywords: [
    'FFCS', 'VIT FFCS', 'FFCS timetable', 'VIT timetable generator',
    'FFCS planner', 'VIT Chennai FFCS', 'VIT AP FFCS',
    'FFCS slot generator', 'timetable optimizer VIT'
  ],
  verification: {
    google: "voAbkQfitUoqZMU3RLOdPWoPdibPcUtZpEWT3_M9DzY",
  },
  openGraph: {
    title: 'Ultimate FFCS — Stop Checking Combinations Manually',
    description: 'Automatically generate and rank every valid FFCS timetable. Free for VIT students.',
    url: 'https://ffcsmaker.vercel.app/',
    siteName: 'Ultimate FFCS',
    images: [
      {
        url: 'favicon.png',   // 1200x630px — make this
        width: 1200,
        height: 630,
        alt: 'Ultimate FFCS Timetable Generator for VIT Students',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ultimate FFCS | VIT Timetable Generator',
    description: 'Generate every valid FFCS timetable automatically. Free for VIT students.',
    images: ['favicon.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL('https://ffcsmaker.vercel.app/'),
}


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
