import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./fp-tokens.css";
import { FPRoot } from "@/components/fp-ui/fp-root";
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
        url: '/og-image.png',
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
    images: ['/og-image.png'],
  },
  manifest: '/site.webmanifest',
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
  // FPRoot toggles the dark/light class on <html> from the user's theme preference.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, calSansFallback.variable, "font-sans antialiased")}>
        <FPRoot>{children}</FPRoot>
        <Analytics />
      </body>
    </html>
  );
}
