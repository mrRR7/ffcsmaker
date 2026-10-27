import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./fp-tokens.css";
import "./fp-transitions.css";
import { FPRoot } from "@/components/fp-ui/fp-root";
import { cn } from "@/utils/cn";
import { SITE_URL } from "@/lib/site";

// Cloudflare Web Analytics: cookieless, off until the beacon token is set.
const CF_BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;


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
    default: "VIT FFCS Timetable Generator: Vellore, Chennai, Bhopal & AP",
    template: "%s | Ultimate FFCS"
  },
  description: "Build a clash-free VIT FFCS timetable in about a minute. Add courses, set preferences, get every valid week ranked. Free for Vellore, Chennai, Bhopal & AP.",
  verification: {
    google: "voAbkQfitUoqZMU3RLOdPWoPdibPcUtZpEWT3_M9DzY",
  },
  openGraph: {
    title: "Ultimate FFCS — every clash-free timetable, ranked",
    description: "Generate and rank every valid FFCS timetable. Free for VIT Vellore, Chennai, Bhopal & AP students.",
    siteName: "Ultimate FFCS",
    url: "/",
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
    description: "Generate and rank every valid FFCS timetable. Free for VIT Vellore, Chennai, Bhopal & AP students.",
    images: ["/og-image.png"],
  },
  metadataBase: new URL(SITE_URL),
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
        {CF_BEACON_TOKEN ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
          />
        ) : null}
      </body>
    </html>
  );
}
