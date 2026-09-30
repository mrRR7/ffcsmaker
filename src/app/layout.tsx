import type { Metadata, Viewport } from "next";
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


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export const metadata: Metadata = {
  title: {
    default: "FFCS Timetable Generator for VIT Vellore, Chennai & Bhopal",
    template: "%s | Ultimate FFCS"
  },
  description: "Build a clash-free VIT FFCS timetable in about a minute. Add courses, set preferences, get every valid combination ranked. Free for Vellore, Chennai & Bhopal.",
  verification: {
    google: "voAbkQfitUoqZMU3RLOdPWoPdibPcUtZpEWT3_M9DzY",
  },
  openGraph: {
    title: "Ultimate FFCS — every clash-free timetable, ranked",
    description: "Generate and rank every valid FFCS timetable. Free for VIT Vellore, Chennai & Bhopal students.",
    siteName: "Ultimate FFCS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ultimate FFCS timetable generator for VIT students",
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FFCS Timetable Generator for VIT",
    description: "Generate and rank every valid FFCS timetable. Free for VIT Vellore, Chennai & Bhopal students.",
    images: ["/og-image.png"],
  },
  manifest: "/site.webmanifest",
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
      <body className={cn(inter.variable, "font-sans antialiased")}>
        <FPRoot>{children}</FPRoot>
        <Analytics />
      </body>
    </html>
  );
}
